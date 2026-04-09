export type AppScreenState =
  | "loading"
  | "entry"
  | "explore"
  | "auth_login"
  | "auth_otp"
  | "dashboard"
  | "lot_detail"
  | "contract_detail"
  | "admin_decoder"
  | "admin_data_hub"
  | "admin_role_monitor"
  | "rfq_list"
  | "rfq_detail"
  | "rfq_edit"
  | "offer_detail"
  | "bank_review"
  | "bank_approval_edit"
  | "lab_result"
  | "lab_result_edit"
  | "lab_queue"
  | "trade_ready"
  | "farmer_fields"
  | "farmer_field_new"
  | "farmer_field_edit"
  | "farmer_my_lots"
  | "importer_rfq_new"
  | "importer_lot_trace"
  | "exporter_offer_new"
  | "aggregator_receive"
  | "aggregator_aggregate";

export const stateMeta: Record<AppScreenState, { label: string; primaryAction: string }> = {
  loading: { label: "Loading", primaryAction: "Initializing..." },
  entry: { label: "Entry", primaryAction: "Continue" },
  explore: { label: "Explore", primaryAction: "Proceed to login" },
  auth_login: { label: "Auth Login", primaryAction: "Request OTP" },
  auth_otp: { label: "Auth OTP", primaryAction: "Verify OTP" },
  dashboard: { label: "Dashboard", primaryAction: "Open lot detail" },
  lot_detail: { label: "Lot Detail", primaryAction: "Open contract detail" },
  contract_detail: { label: "Contract Detail", primaryAction: "Open admin decoder" },
  admin_decoder: { label: "Admin Decoder", primaryAction: "Return to dashboard" },
  admin_data_hub: { label: "Admin Data", primaryAction: "Return to dashboard" },
  admin_role_monitor: { label: "Role Monitor", primaryAction: "Open monitored preview" },
  rfq_list: { label: "RFQ List", primaryAction: "Open RFQ" },
  rfq_detail: { label: "RFQ Detail", primaryAction: "Continue to offer" },
  rfq_edit: { label: "Edit RFQ", primaryAction: "Save draft" },
  offer_detail: { label: "Offer Detail", primaryAction: "Open linked lot" },
  bank_review: { label: "Bank Review", primaryAction: "Continue to lab result" },
  bank_approval_edit: { label: "Bank Edit", primaryAction: "Save approval" },
  lab_result: { label: "Lab Result", primaryAction: "Continue to readiness" },
  lab_result_edit: { label: "Lab Edit", primaryAction: "Save result" },
  lab_queue: { label: "Lab Queue", primaryAction: "Record result" },
  trade_ready: { label: "Trade Ready", primaryAction: "Return to dashboard" },
  farmer_fields: { label: "My Fields", primaryAction: "Add field" },
  farmer_field_new: { label: "New Field", primaryAction: "Save field" },
  farmer_field_edit: { label: "Edit Field", primaryAction: "Save changes" },
  farmer_my_lots: { label: "My Lots", primaryAction: "Open lot" },
  importer_rfq_new: { label: "New RFQ", primaryAction: "Create draft" },
  importer_lot_trace: { label: "Lot Traceability", primaryAction: "Resolve lot code" },
  exporter_offer_new: { label: "New Offer", primaryAction: "Save offer" },
  aggregator_receive: { label: "Receive Lot", primaryAction: "Record receive" },
  aggregator_aggregate: { label: "Aggregate Lots", primaryAction: "Create aggregate" },
};
