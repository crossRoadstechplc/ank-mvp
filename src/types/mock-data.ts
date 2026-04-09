export type RoleKey =
  | "farmer"
  | "aggregator"
  | "processor"
  | "exporter"
  | "importer"
  | "bank_officer"
  | "admin"
  | "transporter"
  | "lab_officer";

/** Optional audit fields for runtime-created or updated entities */
export interface AuditMeta {
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface AppConfig {
  name: string;
  version: string;
  commodity: string;
  environment: string;
}

export interface AppConfigFile {
  app: AppConfig;
}

export interface Role {
  id: string;
  key: RoleKey;
  name: string;
  dashboard: string;
  permissions: string[];
}

export interface RolesFile {
  roles: Role[];
}

export interface Organization {
  id: string;
  name: string;
  type: string;
}

export interface OrganizationsFile {
  organizations: Organization[];
}

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  password: string;
  otpEnabled: boolean;
  defaultOtp: string;
  status: string;
  primaryRole: RoleKey;
  roleIds: string[];
  organizationId: string;
  linkedActorId: string;
}

export interface UsersFile {
  users: User[];
}

export interface Actor {
  id: string;
  type: "individual" | "organization";
  displayName: string;
  primaryRole: RoleKey;
  organizationId: string;
  userId: string | null;
  status: string;
  rating: number;
  trustScore: number;
  kycStatus?: string;
  kybStatus?: string;
}

export interface ActorsFile {
  actors: Actor[];
}

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface Farm extends AuditMeta {
  id: string;
  uid: string;
  name: string;
  ownerActorId: string;
  managerActorId: string;
  organizationId: string;
  region: string;
  zone: string;
  woreda: string;
  kebele: string;
  country: string;
  elevationM: number;
  sizeHectares: number;
  coffeeVarieties: string[];
  farmingType: string;
  coordinates: GeoCoordinates;
  polygon: [number, number][];
  eudrStatus: string;
  status: string;
  notes?: string;
}

export interface FarmsFile {
  farms: Farm[];
}

export interface Facility {
  id: string;
  uid: string;
  name: string;
  facilityType: string;
  ownerActorId: string;
  operatorActorId: string;
  organizationId: string;
  region: string;
  woreda: string;
  coordinates: GeoCoordinates;
  status: string;
}

export interface FacilitiesFile {
  facilities: Facility[];
}

export interface Vehicle {
  id: string;
  uid: string;
  plateNumber: string;
  vehicleType: string;
  ownerActorId: string;
  assignedDriverActorId: string;
  capacityKg: number;
  gpsEnabled: boolean;
  status: string;
}

export interface Driver {
  id: string;
  uid: string;
  actorId: string;
  licenseNumber: string;
  phone: string;
  status: string;
}

export interface VehiclesFile {
  vehicles: Vehicle[];
  drivers: Driver[];
}

export interface Lot extends AuditMeta {
  id: string;
  internalUuid: string;
  publicLotCode: string;
  traceKey: string;
  commodity: string;
  form: string;
  sourceType: string;
  farmId: string | null;
  originActorId: string;
  currentOwnerActorId: string;
  currentCustodianActorId: string;
  facilityId: string | null;
  weightKg: number;
  status: string;
  qualityGrade: string | null;
  parentLotIds: string[];
  childLotIds: string[];
  harvestDate: string;
  createdAt: string;
  geoInherited: boolean;
  integrityStatus: string;
  notes?: string;
  /** Exporter reservation / hold label for trade MVP */
  exportReservationStatus?: string | null;
  /** Post-process transport → lab → export gate (see lab-flow helpers) */
  labStatus?: string | null;
}

export interface LotsFile {
  lots: Lot[];
}

export interface InventoryLoss {
  type: string;
  weightKg: number;
}

export interface InventoryEvent extends AuditMeta {
  id: string;
  type: string;
  timestamp: string;
  lotId: string;
  actorId: string;
  fromActorId?: string | null;
  toActorId?: string | null;
  facilityId?: string | null;
  vehicleId?: string;
  driverId?: string;
  parentLotIds?: string[];
  outputLotIds?: string[];
  weightKg?: number;
  reportedWeightKg?: number;
  confirmedWeightKg?: number;
  inputWeightKg?: number;
  outputWeightKg?: number;
  varianceKg?: number;
  losses?: InventoryLoss[];
  reasonCode?: string;
  status: string;
  verificationStatus: string;
  notes: string;
}

export interface InventoryEventsFile {
  inventoryEvents: InventoryEvent[];
}

export interface Rfq extends AuditMeta {
  id: string;
  uid: string;
  buyerActorId: string;
  title: string;
  commodity: string;
  form: string;
  targetQuantityKg: number;
  minimumGrade: string;
  originPreference: string[];
  incoterm: string;
  deliveryWindowStart: string;
  deliveryWindowEnd: string;
  status: string;
  participationRule: string;
  minimumTrustScore: number;
  invitedActorIds: string[];
  createdAt: string;
}

export interface RfqsFile {
  rfqs: Rfq[];
}

export interface Offer extends AuditMeta {
  id: string;
  rfqId: string;
  sellerActorId: string;
  linkedLotIds: string[];
  offeredQuantityKg: number;
  pricePerKgUsd: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface OffersFile {
  offers: Offer[];
}

export interface Auction {
  id: string;
  uid: string;
  auctionType: string;
  createdByActorId: string;
  title: string;
  commodity: string;
  status: string;
  accessMode: string;
  invitedActorIds: string[];
  minimumTrustScore: number;
  startTime: string;
  endTime: string;
}

export interface AuctionsFile {
  auctions: Auction[];
}

export interface Contract {
  id: string;
  uid: string;
  rfqId: string;
  offerId: string;
  buyerActorId: string;
  sellerActorId: string;
  linkedLotIds: string[];
  contractType: string;
  quantityKg: number;
  pricePerKgUsd: number;
  currency: string;
  incoterm: string;
  paymentTerms: string;
  qualityTerms: string;
  deliveryTerms: string;
  status: string;
  createdAt: string;
}

export interface ContractsFile {
  contracts: Contract[];
}

export interface BankApproval extends AuditMeta {
  id: string;
  contractId: string;
  bankActorId: string;
  buyerApprovalStatus: string;
  sellerApprovalStatus: string;
  guaranteeType: string;
  guaranteeStatus: string;
  partialDefaultCoverage: boolean;
  approvedAmountUsd: number;
  decisionAt: string;
  status: string;
  guaranteeMetadata?: Record<string, string>;
  exposureNotes?: string;
}

export interface BankApprovalsFile {
  bankApprovals: BankApproval[];
}

export interface LabResult extends AuditMeta {
  id: string;
  lotId: string;
  contractId: string;
  labActorId: string;
  sampleCode: string;
  moisturePercent: number;
  screenSize: string;
  defectCount: number;
  cupScore: number;
  gradeConfirmed: string;
  status: string;
  issuedAt: string;
  notes?: string;
}

export interface LabResultsFile {
  labResults: LabResult[];
}

export interface DashboardSummaryCard {
  label: string;
  value: string | number;
}

export interface DashboardChart {
  type: string;
  title: string;
  data: Record<string, string | number>[];
}

export interface DashboardEntry {
  userId: string;
  summaryCards: DashboardSummaryCard[];
  charts: DashboardChart[];
}

export interface DashboardMetricsFile {
  dashboardMetrics: Record<string, DashboardEntry>;
}

export interface LotCodeMapItem {
  publicLotCode: string;
  lotId: string;
  traceKey: string;
}

export interface LotCodeMapFile {
  lotCodeMap: LotCodeMapItem[];
}

export interface MockDataBundle {
  app: AppConfig;
  roles: Role[];
  organizations: Organization[];
  users: User[];
  actors: Actor[];
  farms: Farm[];
  facilities: Facility[];
  vehicles: Vehicle[];
  drivers: Driver[];
  lots: Lot[];
  inventoryEvents: InventoryEvent[];
  rfqs: Rfq[];
  offers: Offer[];
  auctions: Auction[];
  contracts: Contract[];
  bankApprovals: BankApproval[];
  labResults: LabResult[];
  dashboardMetrics: Record<string, DashboardEntry>;
  lotCodeMap: LotCodeMapItem[];
}

/** Mutable runtime copy: app + roles always come from seed */
export type LiveDataBundle = Omit<MockDataBundle, "app" | "roles">;
