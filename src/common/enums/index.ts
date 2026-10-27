export enum Role {
  ADMIN = 'ADMIN',
  TECHNICIAN = 'TECHNICIAN',
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  INACTIVE = 'INACTIVE',
}

// Mecánicos y talleres
export enum EntityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum MaintenanceType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
}

export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}