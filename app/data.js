window.PEAK_DATA = [
  {
    part_number: "ELEC-0001",
    name: "Valve Controller PCB",
    description: "Control board for valve actuation and telemetry.",
    category: "electrical",
    project: "PR6 Propulsion Controller",
    lifecycle_state: "draft",
    revision: "A",
    owner: "engineering@example.com",
    tags: ["pcb", "controls"],
    onshape: [],
    documents: [
      {
        type: "schematic",
        title: "Valve Controller Schematic",
        google_drive_file_id: "example-schematic-file-id",
        url: "https://drive.google.com/file/d/example-schematic-file-id/view"
      }
    ],
    manufacturers: [],
    approvers: [
      {
        name: "Maya Patel",
        role: "Electrical Lead",
        status: "pending",
        date: ""
      },
      {
        name: "Jon Reed",
        role: "Systems Engineering",
        status: "pending",
        date: ""
      }
    ],
    bom: [
      {
        child_part_number: "MECH-0001",
        quantity: 1,
        unit: "each"
      },
      {
        child_part_number: "ELEC-0002",
        quantity: 2,
        unit: "each"
      },
      {
        child_part_number: "MECH-0002",
        quantity: 1,
        unit: "each"
      }
    ],
    change_summary: "Initial scaffold record.",
    created_at: "2026-06-16",
    updated_at: "2026-06-16"
  },
  {
    part_number: "MECH-0001",
    name: "Main Oxidizer Valve",
    description: "Electrically actuated oxidizer isolation valve.",
    category: "mechanical",
    project: "PR6 Feed System",
    lifecycle_state: "draft",
    revision: "A",
    owner: "engineering@example.com",
    tags: ["valve", "oxidizer"],
    onshape: [
      {
        type: "part_studio",
        title: "Main Oxidizer Valve CAD",
        document_id: "example-document-id",
        workspace_id: "example-workspace-id",
        element_id: "example-element-id",
        url: "https://cad.onshape.com/documents/example-document-id/w/example-workspace-id/e/example-element-id"
      }
    ],
    documents: [
      {
        type: "specification",
        title: "Main Oxidizer Valve Specification",
        google_drive_file_id: "example-drive-file-id",
        url: "https://drive.google.com/file/d/example-drive-file-id/view"
      }
    ],
    manufacturers: [
      {
        name: "Example Manufacturer",
        manufacturer_part_number: "EX-MOV-001"
      }
    ],
    approvers: [
      {
        name: "Avery Chen",
        role: "Mechanical Lead",
        status: "approved",
        date: "2026-06-16"
      },
      {
        name: "Maya Patel",
        role: "Controls Interface",
        status: "pending",
        date: ""
      }
    ],
    bom: [
      {
        child_part_number: "MECH-0003",
        quantity: 1,
        unit: "each"
      },
      {
        child_part_number: "MECH-0004",
        quantity: 2,
        unit: "each"
      }
    ],
    change_summary: "Initial scaffold record.",
    created_at: "2026-06-16",
    updated_at: "2026-06-16"
  },
  {
    part_number: "ELEC-0002",
    name: "Valve Position Sensor",
    description: "Dual-channel position sensor used for valve state feedback.",
    category: "electrical",
    project: "PR6 Propulsion Controller",
    lifecycle_state: "in_review",
    revision: "A",
    owner: "avionics@example.com",
    tags: ["sensor", "feedback"],
    onshape: [],
    documents: [
      {
        type: "datasheet",
        title: "Valve Position Sensor Datasheet",
        google_drive_file_id: "example-sensor-datasheet",
        url: "https://drive.google.com/file/d/example-sensor-datasheet/view"
      }
    ],
    manufacturers: [
      {
        name: "Example Sensors",
        manufacturer_part_number: "EX-VPS-002"
      }
    ],
    approvers: [
      {
        name: "Maya Patel",
        role: "Electrical Lead",
        status: "approved",
        date: "2026-06-15"
      }
    ],
    bom: [],
    change_summary: "Added redundant sensor channel requirement.",
    created_at: "2026-06-14",
    updated_at: "2026-06-16"
  },
  {
    part_number: "MECH-0002",
    name: "Valve Mounting Bracket",
    description: "Machined bracket that mounts the oxidizer valve to the engine frame.",
    category: "mechanical",
    project: "PR6 Feed System",
    lifecycle_state: "released",
    revision: "B",
    owner: "mechanical@example.com",
    tags: ["bracket", "mount"],
    onshape: [
      {
        type: "assembly",
        title: "Valve Mounting Bracket Assembly",
        document_id: "example-bracket-document",
        version_id: "example-bracket-version",
        element_id: "example-bracket-element",
        url: "https://cad.onshape.com/documents/example-bracket-document/v/example-bracket-version/e/example-bracket-element"
      }
    ],
    documents: [
      {
        type: "drawing",
        title: "Valve Mounting Bracket Drawing",
        google_drive_file_id: "example-bracket-drawing",
        url: "https://drive.google.com/file/d/example-bracket-drawing/view"
      }
    ],
    manufacturers: [
      {
        name: "Example Machine Shop",
        vendor_part_number: "SHOP-BRKT-42"
      }
    ],
    approvers: [
      {
        name: "Avery Chen",
        role: "Mechanical Lead",
        status: "approved",
        date: "2026-06-12"
      }
    ],
    bom: [],
    change_summary: "Released bracket hole pattern update.",
    created_at: "2026-06-10",
    updated_at: "2026-06-15"
  },
  {
    part_number: "MECH-0003",
    name: "Valve Body",
    description: "Primary machined body for the main oxidizer valve.",
    category: "mechanical",
    project: "PR6 Feed System",
    lifecycle_state: "draft",
    revision: "A",
    owner: "mechanical@example.com",
    tags: ["valve", "machined"],
    onshape: [],
    documents: [],
    manufacturers: [
      {
        name: "Example Machine Shop",
        vendor_part_number: "SHOP-BODY-11"
      }
    ],
    approvers: [],
    bom: [],
    change_summary: "Initial valve body placeholder.",
    created_at: "2026-06-15",
    updated_at: "2026-06-16"
  },
  {
    part_number: "MECH-0004",
    name: "Valve Seal Kit",
    description: "Seal kit containing primary and secondary oxidizer-compatible seals.",
    category: "mechanical",
    project: "PR6 Feed System",
    lifecycle_state: "in_review",
    revision: "A",
    owner: "materials@example.com",
    tags: ["seal", "consumable"],
    onshape: [],
    documents: [
      {
        type: "inspection_plan",
        title: "Valve Seal Kit Inspection Plan",
        google_drive_file_id: "example-seal-inspection",
        url: "https://drive.google.com/file/d/example-seal-inspection/view"
      }
    ],
    manufacturers: [
      {
        name: "Example Seal Vendor",
        manufacturer_part_number: "EX-SEAL-KIT-7"
      }
    ],
    approvers: [
      {
        name: "Riley Morgan",
        role: "Materials",
        status: "pending",
        date: ""
      }
    ],
    bom: [],
    change_summary: "Pending oxygen compatibility review.",
    created_at: "2026-06-15",
    updated_at: "2026-06-16"
  }
];
window.PLM_DATA = window.PEAK_DATA;
