<div align="center">

# ⚡ seo-google-indexer

**Herramienta de indexación rápida oficial de Google y Skill para Antigravity / Claude Code (Indexing API v3)**  
*Soporte universal para Astro, Next.js, Nuxt, Vue, Vite, HTML estático y cualquier proyecto web.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node: >=18.0.0](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Google Indexing API](https://img.shields.io/badge/Google%20API-v3-orange.svg)](https://developers.google.com/search/apis/indexing-api/v3/quickstart)

[English](README.md) • [简体中文](README.zh-CN.md) • [日本語](README.ja.md) • [Español](README.es.md)

</div>

---

## ⚡ Prompt de instalación en 1 clic (Para tu Asistente de IA)

Si utilizas **Antigravity** o **Claude Code**, copia y pega este prompt directamente en el chat:

```markdown
Por favor, instala y configura esta Skill de indexación rápida de Google:
https://github.com/Sacilave/seo-google-indexer.git
Tras la instalación, realiza un autodiagnóstico e inicializa el script de envío en el proyecto actual.
```

---

## 📖 ¿Cómo funciona? ¿Estamos enviando a GSC?

**No, esto no es un simple envío pasivo de sitemap en Google Search Console. Se comunica directamente con la `Web Search Indexing API (v3)` oficial de Google.**

- **Envío manual en GSC**: Funciona como una sugerencia pasiva. Los rastreadores pueden tardar **días o semanas** en visitar las páginas.
- **Llamada a la Indexing API (Este proyecto)**: Envía eventos `URL_UPDATED` en tiempo real directamente al motor de programación de Googlebot, solicitando el rastreo inmediato. ¡Los rastreadores suelen llegar en **minutos u horas**!

> 💡 **¿Por qué se necesita Google Search Console?**  
> Google requiere que la Cuenta de Servicio de Google Cloud se agregue como **Propietario (Owner)** de tu sitio en GSC para certificar la titularidad del dominio.

---

## ✨ Características principales

- 🚀 **Rastreo en minutos**: Olvídate de largas esperas y avisa directamente al núcleo de Googlebot.
- 🎯 **Múltiples modos de entrada**:
  - **Modo local**: Detección automática de `public/sitemap.xml`, `dist/sitemap.xml`, etc.
  - **Sitemaps anidados**: Expansión recursiva automática de sitemaps secundarios dentro de `<sitemapindex>`.
  - **Modo sitemap remoto**: Envía directamente desde la URL pública: `npm run seo:push https://example.com/sitemap.xml`.
  - **Modo URL individual**: Envía un artículo recién publicado: `npm run seo:push https://example.com/blog/mi-post`.
- 🛡️ **Máxima fiabilidad**:
  - Límite de tasa con retrasos suaves de 150 ms para evitar bloqueos por concurrencia.
  - Reintentos automáticos ante errores `429 Too Many Requests`.
  - Protección de cuota diaria (límite predeterminado de 200 URLs).
  - Modo `--dry-run` para previsualizar URLs sin gastar cuota.
  - Diagnóstico integrado `--doctor` para verificar credenciales y proxy.
- 🌐 **Túnel proxy nativo sin dependencias**: Detección automática de puertos locales (7897, 7890, 10809).

---

## 📋 Lista de pasos manuales (Solo 2 pasos rápidos)

### Paso 1: Obtener la clave de servicio (🌟 Solo 1 vez en la vida)
Habilita la Indexing API en [Google Cloud Console](https://console.cloud.google.com/) y descarga la clave JSON de la Cuenta de Servicio.

- **Recomendado para máxima privacidad**: Renombra el archivo a `service-account.json` y guárdalo en tu carpeta de usuario global:
  - **Windows**: `C:\Users\<TuUsuario>\.config\google-seo\service-account.json`
  - **macOS / Linux**: `~/.config/google-seo/service-account.json`

---

### Paso 2: Conceder permisos en GSC (🌟 30 segundos por sitio nuevo)
1. Abre [Google Search Console](https://search.google.com/search-console) y selecciona tu sitio.
2. Ve a **Ajustes** ➡️ **Usuarios y permisos** ➡️ **Añadir usuario**.
3. Pega el correo de tu cuenta de servicio (ejecuta `npm run seo:push -- --doctor` para verlo destacado).
4. **El permiso debe ser "Propietario" (Owner)**. Guarda los cambios.

---

### Paso 3: Rutina diaria (🤖 100% Automático)
Tras desplegar tu web, ejecuta:
```bash
npm run seo:push
```

---

## 📄 Licencia

Publicado bajo la [Licencia MIT](LICENSE).
