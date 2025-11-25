flowchart LR
    %% Frontend
    FE[Frontend React] -->|Envía solicitudes| API[API Symfony]
    
    %% Autenticación
    API -->|Valida JWT| JWT[JWT Auth Service]

    %% Base de datos
    API -->|Lee/Escribe| DB[(MySQL Database)]
    
    %% BPM / Workflow
    API -->|Crea/Completa tareas| CAM[Camunda Engine]

    %% Flujo de aprobaciones
    CAM -->|Actualiza estado| DB

    %% Notificaciones (opcional)
    CAM -->|Notifica cambios| FE

    style FE fill:#f9f,stroke:#333,stroke-width:1px
    style API fill:#bbf,stroke:#333,stroke-width:1px
    style JWT fill:#ff9,stroke:#333,stroke-width:1px
    style DB fill:#bfb,stroke:#333,stroke-width:1px
    style CAM fill:#fbb,stroke:#333,stroke-width:1px
