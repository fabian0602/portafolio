# Portafolio — Fabian Almonte

Sitio personal de portafolio profesional. Construido con **HTML, CSS y JavaScript puro**, sin frameworks,
sin dependencias y sin proceso de build.

**En vivo:** https://fabian0602.github.io/portafolio/

## Qué contiene

- Página única responsive (móvil, tablet, escritorio).
- Tema claro y oscuro con preferencia guardada.
- Cuatro proyectos, tres de ellos con **demo funcional dentro de la misma página**:
  - Calculadora con manejo de división entre cero y soporte de teclado.
  - Formulario de reserva con validación de correo, tarjeta (Luhn), vencimiento y CVV.
  - Panel de estudiantes (CRUD) persistido en `localStorage`.
- Accesibilidad: HTML semántico, `aria-live` en errores, foco visible, enlace de salto y
  respeto por `prefers-reduced-motion`.
- CV descargable en PDF generado para tamaño A4.

## Estructura

```
index.html      Estructura y contenido
styles.css      Diseño, tema claro/oscuro y responsive
app.js          Lógica: tema, diálogos, calculadora, validación y CRUD
assets/         CV en PDF
```

## Ejecutar localmente

Abre `index.html` en el navegador. No requiere servidor ni instalación.

## Desplegar

El sitio se publica desde la rama `main`, carpeta raíz, con GitHub Pages.
Cualquier cambio en `main` se publica automáticamente en 1–2 minutos.

## Nota sobre las demos

Las demos son funcionales y no envían datos a ningún servidor. El CRUD guarda solo en el
navegador del visitante (`localStorage`).
