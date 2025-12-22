# Control de Obras

Aplicación web para gestionar obras por zonas, escuelas y tareas con avance, conectada a Supabase.

## Getting Started

### 1. Configurar variables de entorno

Crear `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Ejecutar el servidor de desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Flujo de la aplicación

- **Zonas**: Lista de zonas disponibles
- **Escuelas**: Escuelas dentro de una zona
- **Obras**: Obras de una escuela con estado y fechas
- **Tareas**: Tareas de una obra con avance, rubros y detalles

## Tecnologías

- Next.js 15 con App Router
- TypeScript
- Tailwind CSS
- Supabase (base de datos y autenticación)
