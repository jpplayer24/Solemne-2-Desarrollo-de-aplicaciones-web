# Arquitectura de Microservicios - Tienda de Mochilas

El siguiente diagrama detalla la separación de dominios, servicios y bases de datos para el proyecto Solemne 2.

```mermaid
graph TD
    %% Definición de Nodos de Interfaz
    Client[Frontend React + Vite\nDespliegue: Vercel]

    %% Microservicio de Gestión
    subgraph Dominio de Gestión
        API_G[API Gestión\nDjango DRF\nDespliegue: Render]
        DB_G[(PostgreSQL\nPropiedad: Usuarios, Roles,\nConfiguración)]
        API_G --> DB_G
    end

    %% Microservicio de Catálogo
    subgraph Dominio de Catálogo
        API_C[API Catálogo\nDjango DRF\nDespliegue: Render]
        DB_C[(MongoDB\nPropiedad: Productos, Stock,\nCategorías)]
        API_C --> DB_C
    end

    %% Microservicio de Comercio
    subgraph Dominio de Comercio
        API_Com[API Comercio\nDjango DRF\nDespliegue: Render]
        DB_Com[(PostgreSQL / MongoDB\nPropiedad: Órdenes, Pagos,\nCarritos)]
        API_Com --> DB_Com
    end

    %% Conexiones HTTP
    Client -->|Peticiones REST| API_G
    Client -->|Peticiones REST| API_C
    Client -->|Peticiones REST| API_Com