/* =========================================================
   Fabian Almonte — Portafolio
   JavaScript puro. Organizado en módulos por responsabilidad.
   ========================================================= */
(function () {
  "use strict";

  /* ---------------------------------------------------------
     1. UI general: tema, nav, año, diálogos
     --------------------------------------------------------- */
  const UI = {
    init() {
      this.theme();
      this.nav();
      this.dialogs();
      const year = document.getElementById("year");
      if (year) year.textContent = String(new Date().getFullYear());
    },

    theme() {
      const root = document.documentElement;
      const btn = document.getElementById("theme-toggle");
      let saved = null;
      try { saved = localStorage.getItem("fa_theme"); } catch (e) { /* modo privado */ }

      const initial = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const forced = new URLSearchParams(location.search).get("theme");
      root.setAttribute("data-theme", forced === "dark" || forced === "light" ? forced : initial);

      if (!btn) return;
      btn.addEventListener("click", () => {
        const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("fa_theme", next); } catch (e) { /* ignorar */ }
      });
    },

    nav() {
      const nav = document.getElementById("nav");
      if (!nav) return;
      const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 8);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    },

    dialogs() {
      document.querySelectorAll("[data-open]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const dlg = document.getElementById(btn.dataset.open);
          if (!dlg) return;
          dlg.showModal();
          const first = dlg.querySelector("input, button.calc-keys, button");
          if (first) first.focus({ preventScroll: true });
        });
      });

      document.querySelectorAll("dialog").forEach((dlg) => {
        dlg.addEventListener("click", (e) => {
          if (e.target === dlg) dlg.close(); // clic en el fondo
        });
        dlg.querySelectorAll("[data-close]").forEach((b) =>
          b.addEventListener("click", () => dlg.close())
        );
      });
    },
  };

  /* ---------------------------------------------------------
     2. Calculadora
     --------------------------------------------------------- */
  const Calc = {
    screen: null,
    current: "0",
    previous: null,
    operator: null,
    waiting: false,
    error: false,

    init() {
      this.screen = document.getElementById("calc-screen");
      if (!this.screen) return;

      document.querySelectorAll(".calc-keys button").forEach((btn) => {
        btn.addEventListener("click", () => this.press(btn.dataset.k));
      });

      // Soporte de teclado solo mientras el diálogo está abierto
      const dlg = this.screen.closest("dialog");
      if (dlg) {
        dlg.addEventListener("keydown", (e) => {
          const map = { Enter: "=", "=": "=", Escape: "clear", Backspace: "back", "*": "*", "x": "*", "/": "/", "+": "+", "-": "-", ".": ".", ",": "." };
          if (/^[0-9]$/.test(e.key)) { this.press(e.key); e.preventDefault(); return; }
          if (map[e.key]) { this.press(map[e.key]); e.preventDefault(); }
        });
      }
    },

    press(key) {
      if (!key) return;

      if (key === "clear") return this.reset();

      if (this.error && key !== "clear") {
        this.reset();
      }

      if (/^[0-9]$/.test(key)) return this.digit(key);
      if (key === ".") return this.dot();
      if (key === "sign") return this.negate();
      if (key === "pct") return this.percent();
      if (key === "back") return this.backspace();
      if (["+", "-", "*", "/"].includes(key)) return this.setOperator(key);
      if (key === "=") return this.equals();
    },

    render() {
      this.screen.textContent = this.error ? "Error" : this.current;
    },

    round(n) {
      if (!isFinite(n)) return null;
      return Math.round(n * 1e10) / 1e10;
    },

    reset() {
      this.current = "0";
      this.previous = null;
      this.operator = null;
      this.waiting = false;
      this.error = false;
      this.render();
    },

    digit(d) {
      if (this.waiting) {
        this.current = d;
        this.waiting = false;
      } else {
        if (this.current === "0") this.current = d;
        else if (this.current.replace("-", "").replace(".", "").length < 12) this.current += d;
      }
      this.render();
    },

    dot() {
      if (this.waiting) { this.current = "0."; this.waiting = false; }
      else if (!this.current.includes(".")) this.current += ".";
      this.render();
    },

    negate() {
      this.current = this.current.startsWith("-") ? this.current.slice(1) : "-" + this.current;
      this.render();
    },

    percent() {
      const n = parseFloat(this.current);
      if (isNaN(n)) return;
      this.current = String(this.round(n / 100));
      this.render();
    },

    backspace() {
      if (this.waiting) return;
      this.current = this.current.length > 1 ? this.current.slice(0, -1) : "0";
      if (this.current === "-") this.current = "0";
      this.render();
    },

    setOperator(op) {
      const value = parseFloat(this.current);
      if (this.operator && !this.waiting) {
        const result = this.compute(this.previous, value, this.operator);
        if (result === null) return this.fail();
        this.previous = result;
        this.current = String(result);
      } else {
        this.previous = value;
      }
      this.operator = op;
      this.waiting = true;
      this.render();
    },

    equals() {
      if (this.operator === null || this.previous === null) return;
      const value = parseFloat(this.current);
      const result = this.compute(this.previous, value, this.operator);
      if (result === null) return this.fail();

      this.current = String(result);
      this.previous = null;
      this.operator = null;
      this.waiting = true;
      this.render();
    },

    compute(a, b, op) {
      let r;
      switch (op) {
        case "+": r = a + b; break;
        case "-": r = a - b; break;
        case "*": r = a * b; break;
        case "/":
          if (b === 0) return null; // división entre cero controlada
          r = a / b;
          break;
        default: return null;
      }
      return this.round(r);
    },

    fail() {
      this.error = true;
      this.current = "Error";
      this.previous = null;
      this.operator = null;
      this.waiting = true;
      this.render();
    },
  };

  /* ---------------------------------------------------------
     3. Formulario de reserva + validación
     --------------------------------------------------------- */
  const Form = {
    form: null,

    init() {
      this.form = document.getElementById("reservation-form");
      if (!this.form) return;

      const card = document.getElementById("r-card");
      const exp = document.getElementById("r-exp");

      card.addEventListener("input", () => {
        const digits = card.value.replace(/\D/g, "").slice(0, 16);
        card.value = digits.replace(/(.{4})/g, "$1 ").trim();
      });

      exp.addEventListener("input", () => {
        let d = exp.value.replace(/\D/g, "").slice(0, 4);
        if (d.length >= 3) d = d.slice(0, 2) + "/" + d.slice(2);
        exp.value = d;
      });

      this.form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.submit();
      });

      // Limpia el error del campo apenas el usuario corrige
      this.form.querySelectorAll("input").forEach((inp) => {
        inp.addEventListener("input", () => this.clearError(inp.id));
      });
    },

    setError(id, message) {
      const field = document.getElementById(id);
      const slot = this.form.querySelector('[data-err-for="' + id + '"]');
      if (field) field.setAttribute("aria-invalid", "true");
      if (slot) slot.textContent = message;
      return false;
    },

    clearError(id) {
      const field = document.getElementById(id);
      const slot = this.form.querySelector('[data-err-for="' + id + '"]');
      if (field) field.removeAttribute("aria-invalid");
      if (slot) slot.textContent = "";
    },

    valid() {
      let ok = true;
      const $ = (id) => document.getElementById(id);

      const name = $("r-name").value.trim();
      const email = $("r-email").value.trim();
      const date = $("r-date").value;
      const card = $("r-card").value.replace(/\s/g, "");
      const exp = $("r-exp").value;
      const cvv = $("r-cvv").value;

      if (name.length < 3 || !/^[a-záéíóúüñ\s'.-]+$/i.test(name)) {
        ok = this.setError("r-name", "Escribe tu nombre completo (mínimo 3 letras).");
      }
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
        ok = this.setError("r-email", "El correo no tiene un formato válido.");
      }
      if (!date) {
        ok = this.setError("r-date", "Selecciona una fecha.");
      } else {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (new Date(date + "T00:00:00") < today) {
          ok = this.setError("r-date", "La fecha no puede estar en el pasado.");
        }
      }
      if (card.length !== 16) {
        ok = this.setError("r-card", "La tarjeta debe tener 16 dígitos.");
      } else if (!this.luhn(card)) {
        ok = this.setError("r-card", "Ese número de tarjeta no es válido.");
      }
      if (!this.validExpiry(exp)) {
        ok = this.setError("r-exp", "Usa MM/AA y una fecha vigente.");
      }
      if (!/^\d{3}$/.test(cvv)) {
        ok = this.setError("r-cvv", "El CVV debe tener 3 dígitos.");
      }
      return ok;
    },

    // Algoritmo de Luhn: valida el dígito verificador de la tarjeta.
    luhn(num) {
      let sum = 0;
      let dbl = false;
      for (let i = num.length - 1; i >= 0; i--) {
        let n = parseInt(num[i], 10);
        if (dbl) { n *= 2; if (n > 9) n -= 9; }
        sum += n;
        dbl = !dbl;
      }
      return sum % 10 === 0;
    },

    validExpiry(value) {
      const m = /^(\d{2})\/(\d{2})$/.exec(value);
      if (!m) return false;
      const month = Number(m[1]);
      const year = 2000 + Number(m[2]);
      if (month < 1 || month > 12) return false;
      const now = new Date();
      const expiry = new Date(year, month, 0); // último día del mes
      return expiry >= new Date(now.getFullYear(), now.getMonth(), 1);
    },

    submit() {
      this.form.querySelectorAll("input").forEach((i) => this.clearError(i.id));
      const success = document.getElementById("form-success");
      if (success) success.hidden = true;

      if (!this.valid()) {
        const firstBad = this.form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    },
  };

  /* ---------------------------------------------------------
     4. Panel de estudiantes (CRUD + localStorage)
     --------------------------------------------------------- */
  const CRUD = {
    KEY: "fa_students_v1",
    students: [],
    editing: null,
    body: null,

    init() {
      this.body = document.getElementById("crud-body");
      if (!this.body) return;

      this.load();

      document.getElementById("crud-form").addEventListener("submit", (e) => {
        e.preventDefault();
        this.save();
      });
      document.getElementById("crud-cancel").addEventListener("click", () => this.cancelEdit());
      document.getElementById("crud-search").addEventListener("input", () => this.render());

      this.render();
    },

    load() {
      try {
        const raw = localStorage.getItem(this.KEY);
        if (raw) { this.students = JSON.parse(raw); return; }
      } catch (e) { /* datos corruptos o modo privado */ }

      this.students = [
        { id: 1, name: "Ana Pérez", grade: 92 },
        { id: 2, name: "Luis Ramírez", grade: 78 },
        { id: 3, name: "Carla Méndez", grade: 65 }
      ];
      this.persist();
    },

    persist() {
      try { localStorage.setItem(this.KEY, JSON.stringify(this.students)); } catch (e) { /* ignorar */ }
    },

    save() {
      const nameEl = document.getElementById("c-name");
      const gradeEl = document.getElementById("c-grade");
      const name = nameEl.value.trim();
      const grade = Number(gradeEl.value);

      if (name.length < 2) { nameEl.focus(); nameEl.setAttribute("aria-invalid", "true"); return; }
      nameEl.removeAttribute("aria-invalid");

      if (gradeEl.value === "" || isNaN(grade) || grade < 0 || grade > 100) {
        gradeEl.focus(); gradeEl.setAttribute("aria-invalid", "true"); return;
      }
      gradeEl.removeAttribute("aria-invalid");

      if (this.editing !== null) {
        const s = this.students.find((x) => x.id === this.editing);
        if (s) { s.name = name; s.grade = grade; }
        this.cancelEdit();
      } else {
        const id = this.students.length ? Math.max(...this.students.map((s) => s.id)) + 1 : 1;
        this.students.push({ id, name, grade });
        nameEl.value = "";
        gradeEl.value = "";
        nameEl.focus();
      }

      this.persist();
      this.render();
    },

    startEdit(id) {
      const s = this.students.find((x) => x.id === id);
      if (!s) return;
      this.editing = id;
      document.getElementById("c-name").value = s.name;
      document.getElementById("c-grade").value = s.grade;
      document.getElementById("crud-submit").textContent = "Guardar cambios";
      document.getElementById("crud-cancel").hidden = false;
      document.getElementById("c-name").focus();
    },

    cancelEdit() {
      this.editing = null;
      document.getElementById("c-name").value = "";
      document.getElementById("c-grade").value = "";
      document.getElementById("crud-submit").textContent = "Agregar";
      document.getElementById("crud-cancel").hidden = true;
    },

    remove(id) {
      this.students = this.students.filter((s) => s.id !== id);
      if (this.editing === id) this.cancelEdit();
      this.persist();
      this.render();
    },

    render() {
      const term = (document.getElementById("crud-search").value || "").toLowerCase().trim();
      const rows = this.students.filter((s) => s.name.toLowerCase().includes(term));

      this.body.innerHTML = "";
      rows.forEach((s, i) => {
        const tr = document.createElement("tr");

        const approved = s.grade >= 70;
        tr.innerHTML =
          '<td class="num">' + (i + 1) + "</td>" +
          "<td>" + this.escape(s.name) + "</td>" +
          '<td class="num">' + s.grade + "</td>" +
          '<td><span class="badge ' + (approved ? "pass" : "fail") + '">' +
            (approved ? "Aprobado" : "Reprobado") + "</span></td>" +
          '<td class="actions">' +
            '<button class="mini" data-edit="' + s.id + '">Editar</button> ' +
            '<button class="mini danger" data-del="' + s.id + '">Eliminar</button>' +
          "</td>";

        this.body.appendChild(tr);
      });

      this.body.querySelectorAll("[data-edit]").forEach((b) =>
        b.addEventListener("click", () => this.startEdit(Number(b.dataset.edit)))
      );
      this.body.querySelectorAll("[data-del]").forEach((b) =>
        b.addEventListener("click", () => this.remove(Number(b.dataset.del)))
      );

      const count = this.students.length;
      document.getElementById("crud-count").textContent =
        count + (count === 1 ? " registro" : " registros");
      document.getElementById("crud-empty").hidden = rows.length > 0;
    },

    // Evita inyección de HTML al pintar nombres
    escape(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    },
  };

  /* ---------------------------------------------------------
     Arranque
     --------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    UI.init();
    Calc.init();
    Form.init();
    CRUD.init();
  });
})();
