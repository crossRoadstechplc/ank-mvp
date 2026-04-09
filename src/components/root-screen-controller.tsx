"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { FarmerFieldEditForm } from "@/components/farmer-field-edit-form";
import { LineageTree, buildLineageNodes } from "@/components/lot-lineage-tree";
import { Button } from "@/components/ui/button";
import {
  canTransporterAcceptLot,
  canTransporterHandoverToLab,
  isExportTradeEligibleLot,
  isLabIntakeLot,
  labResultSummaryForLot,
  normalizeLotLabStatus,
} from "@/lib/lab-flow";
import { resolveLotIdFromPublicCode } from "@/lib/lot-public-code";
import {
  farmFieldFormSchema,
  labResultFormSchema,
  offerDraftSchema,
  otpSchema,
  rfqDraftSchema,
} from "@/lib/schemas/forms";
import { useAppStore } from "@/store/use-app-store";
import type { LiveDataBundle, Lot, MockDataBundle, User } from "@/types/mock-data";

const FarmerFieldMapPicker = dynamic(
  () =>
    import("@/components/farmer-field-map-picker").then((mod) => mod.FarmerFieldMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
        Loading map…
      </div>
    ),
  },
);

function ScreenCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
      <p className="mt-3 text-sm text-zinc-600">{description}</p>
    </div>
  );
}

type MassUnit = "kg" | "lb";
const KG_PER_LB = 0.45359237;

function toKg(value: number, unit: MassUnit): number {
  if (!Number.isFinite(value)) return 0;
  return unit === "lb" ? value * KG_PER_LB : value;
}

export function RootScreenController({
  monitorPreview = false,
  previewEmailPrefill = "",
  previewPasswordPrefill = "",
  previewAutoLogin = false,
}: {
  monitorPreview?: boolean;
  previewEmailPrefill?: string;
  previewPasswordPrefill?: string;
  previewAutoLogin?: boolean;
}) {
  const currentState = useAppStore((s) => s.currentState);
  const data = useAppStore((s) => s.data);
  const authenticated = useAppStore((s) => s.authenticated);
  const pendingLoginUserId = useAppStore((s) => s.pendingLoginUserId);
  const selectedListingId = useAppStore((s) => s.selectedListingId);
  const selectedListingType = useAppStore((s) => s.selectedListingType);
  const selectedLotId = useAppStore((s) => s.selectedLotId);
  const selectedRfqId = useAppStore((s) => s.selectedRfqId);
  const selectedOfferId = useAppStore((s) => s.selectedOfferId);
  const selectedContractId = useAppStore((s) => s.selectedContractId);
  const selectedBankApprovalId = useAppStore((s) => s.selectedBankApprovalId);
  const selectedLabResultId = useAppStore((s) => s.selectedLabResultId);
  const lastOperationMessage = useAppStore((s) => s.lastOperationMessage);
  const lastMassBalance = useAppStore((s) => s.lastMassBalance);
  const attemptLogin = useAppStore((s) => s.attemptLogin);
  const verifyOtp = useAppStore((s) => s.verifyOtp);
  const createMockPickEvent = useAppStore((s) => s.createMockPickEvent);
  const validatePendingLot = useAppStore((s) => s.validatePendingLot);
  const processLotWithLosses = useAppStore((s) => s.processLotWithLosses);
  const acceptTransportCustody = useAppStore((s) => s.acceptTransportCustody);
  const handoverCustodyToLab = useAppStore((s) => s.handoverCustodyToLab);
  const receiveLotAsAggregator = useAppStore((s) => s.receiveLotAsAggregator);
  const createAggregatedLot = useAppStore((s) => s.createAggregatedLot);
  const updateProvisionalLot = useAppStore((s) => s.updateProvisionalLot);
  const archiveFarmerLot = useAppStore((s) => s.archiveFarmerLot);
  const createFarmField = useAppStore((s) => s.createFarmField);
  const updateFarmField = useAppStore((s) => s.updateFarmField);
  const archiveFarmField = useAppStore((s) => s.archiveFarmField);
  const createImporterRfq = useAppStore((s) => s.createImporterRfq);
  const updateImporterRfq = useAppStore((s) => s.updateImporterRfq);
  const archiveImporterRfq = useAppStore((s) => s.archiveImporterRfq);
  const createExporterOffer = useAppStore((s) => s.createExporterOffer);
  const updateLotExportReservation = useAppStore((s) => s.updateLotExportReservation);
  const updateBankApprovalRecord = useAppStore((s) => s.updateBankApprovalRecord);
  const createLabResultRecord = useAppStore((s) => s.createLabResultRecord);
  const updateLabResultRecord = useAppStore((s) => s.updateLabResultRecord);
  const finalizeLabResultRecord = useAppStore((s) => s.finalizeLabResultRecord);
  const quarantineLot = useAppStore((s) => s.quarantineLot);
  const releaseLotQuarantine = useAppStore((s) => s.releaseLotQuarantine);
  const adminArchiveEntity = useAppStore((s) => s.adminArchiveEntity);
  const resetLiveDataToSeed = useAppStore((s) => s.resetLiveDataToSeed);
  const exportLiveDataSnapshot = useAppStore((s) => s.exportLiveDataSnapshot);
  const clearLocalState = useAppStore((s) => s.clearLocalState);
  const userId = useAppStore((s) => s.userId);
  const primaryRole = useAppStore((s) => s.primaryRole);
  const goToState = useAppStore((s) => s.goToState);
  const openLotDetail = useAppStore((s) => s.openLotDetail);
  const clearSelectedLot = useAppStore((s) => s.clearSelectedLot);
  const startTradeFlow = useAppStore((s) => s.startTradeFlow);
  const openRfqDetail = useAppStore((s) => s.openRfqDetail);
  const openRfqEdit = useAppStore((s) => s.openRfqEdit);
  const openOfferDetail = useAppStore((s) => s.openOfferDetail);
  const openContractDetail = useAppStore((s) => s.openContractDetail);
  const openBankReview = useAppStore((s) => s.openBankReview);
  const openBankApprovalEdit = useAppStore((s) => s.openBankApprovalEdit);
  const openLabResult = useAppStore((s) => s.openLabResult);
  const openLabResultEdit = useAppStore((s) => s.openLabResultEdit);
  const openFarmerFieldEdit = useAppStore((s) => s.openFarmerFieldEdit);
  const setAdminDataEntity = useAppStore((s) => s.setAdminDataEntity);
  const setOperationResult = useAppStore((s) => s.setOperationResult);
  const selectedFarmId = useAppStore((s) => s.selectedFarmId);
  const adminDataEntity = useAppStore((s) => s.adminDataEntity);
  const lastOutputLotId = useAppStore((s) => s.lastOutputLotId);
  const permissions = useAppStore((s) => s.permissions);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [decoderCode, setDecoderCode] = useState("");
  const [decodedLotId, setDecodedLotId] = useState<string | null>(null);
  const [decoderStatus, setDecoderStatus] = useState<
    "idle" | "loading" | "success" | "not_found"
  >("idle");
  const [importerTraceCode, setImporterTraceCode] = useState("");
  const [importerDecodedLotId, setImporterDecodedLotId] = useState<string | null>(null);
  const [importerTraceStatus, setImporterTraceStatus] = useState<
    "idle" | "loading" | "success" | "not_found"
  >("idle");
  const [monitorSearch, setMonitorSearch] = useState("");
  const [monitorSelectedUserId, setMonitorSelectedUserId] = useState<string | null>(null);
  const [monitorPreviewReload, setMonitorPreviewReload] = useState(0);
  const [monitorPreviewResetCounter, setMonitorPreviewResetCounter] = useState(() => Date.now());
  const [monitorAutoLogin, setMonitorAutoLogin] = useState(false);
  const [pickFarmId, setPickFarmId] = useState("");
  const [pickWeightKg, setPickWeightKg] = useState("");
  const [validateWeightKg, setValidateWeightKg] = useState("");
  const [validateWeightUnit, setValidateWeightUnit] = useState<MassUnit>("kg");
  const [validateTargetLotId, setValidateTargetLotId] = useState<string | null>(null);
  const [processOutputKg, setProcessOutputKg] = useState("");
  const [processOutputUnit, setProcessOutputUnit] = useState<MassUnit>("kg");
  const [processLossUnit, setProcessLossUnit] = useState<MassUnit>("kg");
  const [lossRows, setLossRows] = useState<Array<{ type: string; weightKg: string }>>([
    { type: "pulp", weightKg: "" },
  ]);
  const [processNotes, setProcessNotes] = useState("");
  const [processGrade, setProcessGrade] = useState("");
  const [processFacilityId, setProcessFacilityId] = useState("");
  const [processType, setProcessType] = useState<"PROCESS_PULP_AND_WASH" | "PROCESS_HULL_AND_GRADE">(
    "PROCESS_PULP_AND_WASH",
  );
  const [fieldForm, setFieldForm] = useState({
    name: "",
    region: "",
    zone: "",
    woreda: "",
    kebele: "",
    country: "Ethiopia",
    elevationM: "1800",
    sizeHectares: "1",
    farmingType: "smallholder",
    lat: "6.6",
    lng: "38.4",
    varieties: "74110",
    eudrStatus: "ready",
    notes: "",
    polygonText: "",
  });
  /** Boundary from map (or cleared to []); optional JSON import when map has fewer than 3 vertices */
  const [fieldMapPolygon, setFieldMapPolygon] = useState<[number, number][]>([]);
  useEffect(() => {
    if (currentState === "farmer_field_new") {
      setFieldMapPolygon([]);
      setFieldForm((f) => ({ ...f, polygonText: "" }));
    }
  }, [currentState]);
  useEffect(() => {
    if (monitorPreview) {
      setMonitorAutoLogin(previewAutoLogin);
    }
  }, [monitorPreview, previewAutoLogin]);

  useEffect(() => {
    if (!monitorPreview || !previewEmailPrefill) return;
    if (currentState !== "auth_login") return;
    setIdentifier(previewEmailPrefill);
  }, [monitorPreview, previewEmailPrefill, currentState]);

  useEffect(() => {
    if (!monitorPreview || !previewPasswordPrefill) return;
    if (currentState !== "auth_login") return;
    setPassword(previewPasswordPrefill);
  }, [monitorPreview, previewPasswordPrefill, currentState]);

  useEffect(() => {
    previewAutoLoginAttempted.current = false;
  }, [previewEmailPrefill, monitorAutoLogin]);

  useEffect(() => {
    if (!monitorPreview || !monitorAutoLogin || !data) return;
    if (authenticated || currentState !== "auth_login") return;
    if (previewAutoLoginAttempted.current) return;
    const target = data.users.find((u) => u.email.toLowerCase() === previewEmailPrefill.toLowerCase());
    if (!target) return;
    previewAutoLoginAttempted.current = true;
    const loginResult = attemptLogin(target.email, target.password);
    if (!loginResult.ok) {
      setError(loginResult.message ?? "Auto-login failed.");
      return;
    }
    const otpResult = verifyOtp(target.defaultOtp);
    if (!otpResult.ok) {
      setError(otpResult.message ?? "Auto-login OTP failed.");
    }
  }, [
    monitorPreview,
    monitorAutoLogin,
    data,
    authenticated,
    currentState,
    previewEmailPrefill,
    attemptLogin,
    verifyOtp,
  ]);
  const [adminSearch, setAdminSearch] = useState("");
  const [aggReceiveLotId, setAggReceiveLotId] = useState("");
  const [aggSelectedParentIds, setAggSelectedParentIds] = useState<string[]>([]);
  const [aggWeight, setAggWeight] = useState("");
  const [aggWeightUnit, setAggWeightUnit] = useState<MassUnit>("kg");
  const [aggSendToProcessor, setAggSendToProcessor] = useState(true);
  const [aggProcessorActorId, setAggProcessorActorId] = useState("");
  const [processorLotPick, setProcessorLotPick] = useState("");
  const [transporterLotPick, setTransporterLotPick] = useState("");
  const [reservationLabel, setReservationLabel] = useState("");
  const [importerRfqForm, setImporterRfqForm] = useState({
    title: "",
    commodity: "coffee",
    form: "green",
    targetQuantityKg: "10000",
    minimumGrade: "G2",
    originPreference: "Ethiopia",
    incoterm: "FOB",
    deliveryWindowStart: "2026-05-01",
    deliveryWindowEnd: "2026-08-01",
  });
  const [exporterOfferForm, setExporterOfferForm] = useState({
    rfqId: "",
    offeredQuantityKg: "5000",
    pricePerKgUsd: "4.5",
    currency: "USD",
    linkedLotId: "",
  });
  const [bankEditForm, setBankEditForm] = useState({
    guaranteeType: "",
    guaranteeStatus: "",
    exposureNotes: "",
    status: "",
  });
  const [labEditForm, setLabEditForm] = useState({
    sampleCode: "",
    moisturePercent: "10",
    screenSize: "15+",
    defectCount: "0",
    cupScore: "85",
    gradeConfirmed: "G2",
  });
  const [farmerEditWeight, setFarmerEditWeight] = useState("");
  const [farmerEditWeightUnit, setFarmerEditWeightUnit] = useState<MassUnit>("kg");
  const [farmerEditNotes, setFarmerEditNotes] = useState("");
  const [pickWeightUnit, setPickWeightUnit] = useState<MassUnit>("kg");
  const [importerQuantityUnit, setImporterQuantityUnit] = useState<MassUnit>("kg");
  const [exporterQuantityUnit, setExporterQuantityUnit] = useState<MassUnit>("kg");
  const previewAutoLoginAttempted = useRef(false);

  const pendingUser = useMemo(
    () => (data?.users ?? []).find((u) => u.id === pendingLoginUserId) ?? null,
    [data?.users, pendingLoginUserId],
  );
  const monitorSupportedRoles = useMemo(
    () =>
      new Set([
        "farmer",
        "aggregator",
        "processor",
        "transporter",
        "lab_officer",
        "exporter",
        "importer",
        "bank_officer",
        "admin",
      ]),
    [],
  );
  const monitoredUsers = useMemo(() => {
    if (!data) return [] as User[];
    return data.users.filter((u) => monitorSupportedRoles.has(u.primaryRole));
  }, [data, monitorSupportedRoles]);
  const filteredMonitoredUsers = useMemo(() => {
    const q = monitorSearch.trim().toLowerCase();
    if (!q) return monitoredUsers;
    return monitoredUsers.filter((u) =>
      `${u.primaryRole} ${u.fullName} ${u.email}`.toLowerCase().includes(q),
    );
  }, [monitorSearch, monitoredUsers]);

  const marketListings = useMemo(() => {
    if (!data) return [];
    const rfqCards = data.rfqs.map((rfq) => ({
      id: rfq.id,
      type: "rfq" as const,
      title: rfq.title,
      commodityForm: `${rfq.commodity} / ${rfq.form}`,
      quantity: `${rfq.targetQuantityKg.toLocaleString()} kg`,
      origin: rfq.originPreference[0] ?? "Ethiopia",
      details: [
        `Window: ${rfq.deliveryWindowStart} to ${rfq.deliveryWindowEnd}`,
        `Min grade: ${rfq.minimumGrade}`,
      ],
    }));
    const auctionCards = data.auctions.map((auction) => ({
      id: auction.id,
      type: "auction" as const,
      title: auction.title,
      commodityForm: `${auction.commodity} / mixed forms`,
      quantity: "Auction lot bundle",
      origin: "Ethiopia",
      details: [`Access: ${auction.accessMode}`, `Schedule: ${auction.startTime}`],
    }));
    const offerCards = data.offers.map((offer) => {
      const sourceRfq = data.rfqs.find((rfq) => rfq.id === offer.rfqId);
      return {
        id: offer.id,
        type: "offer" as const,
        title: sourceRfq?.title ?? "Offer Listing",
        commodityForm: `${sourceRfq?.commodity ?? "coffee"} / ${sourceRfq?.form ?? "green"}`,
        quantity: `${offer.offeredQuantityKg.toLocaleString()} kg`,
        origin: sourceRfq?.originPreference[0] ?? "Ethiopia",
        details: [
          `Price: ${offer.pricePerKgUsd} ${offer.currency}/kg`,
          `Status: ${offer.status.replaceAll("_", " ")}`,
        ],
      };
    });
    return [...rfqCards, ...auctionCards, ...offerCards];
  }, [data]);

  const selectedListing = useMemo(
    () =>
      marketListings.find(
        (listing) => listing.id === selectedListingId && listing.type === selectedListingType,
      ) ?? null,
    [marketListings, selectedListingId, selectedListingType],
  );

  const selectedLot = useMemo(
    () => (data?.lots ?? []).find((lot) => lot.id === selectedLotId) ?? null,
    [data?.lots, selectedLotId],
  );
  const selectedRfq = useMemo(
    () => (data?.rfqs ?? []).find((rfq) => rfq.id === selectedRfqId) ?? null,
    [data?.rfqs, selectedRfqId],
  );
  const selectedOffer = useMemo(
    () => (data?.offers ?? []).find((offer) => offer.id === selectedOfferId) ?? null,
    [data?.offers, selectedOfferId],
  );
  const selectedContract = useMemo(
    () => (data?.contracts ?? []).find((contract) => contract.id === selectedContractId) ?? null,
    [data?.contracts, selectedContractId],
  );
  const selectedBankApproval = useMemo(
    () => (data?.bankApprovals ?? []).find((row) => row.id === selectedBankApprovalId) ?? null,
    [data?.bankApprovals, selectedBankApprovalId],
  );
  const selectedLabResult = useMemo(
    () => (data?.labResults ?? []).find((row) => row.id === selectedLabResultId) ?? null,
    [data?.labResults, selectedLabResultId],
  );

  const primaryCtaByRole: Record<string, string> = {
    farmer: "Create lot",
    aggregator: "Validate Lot",
    processor: "Process Lot",
    exporter: "Review Ready Lot",
    importer: "Review RFQ",
    bank_officer: "Review Approval",
    transporter: "Accept Custody",
    lab_officer: "Open Lab Queue",
    admin: "Review Exceptions",
  };

  const roleHero: Record<string, { title: string; subtitle: string; activityTitle: string }> = {
    farmer: {
      title: "Farmer Workspace",
      subtitle: "Track farm harvest activity and pending validations.",
      activityTitle: "Recent Picks",
    },
    aggregator: {
      title: "Aggregation Workspace",
      subtitle: "Monitor intake quality and lot validation decisions.",
      activityTitle: "Recent Validation Events",
    },
    processor: {
      title: "Processing Workspace",
      subtitle: "Manage lot transformation outputs and processing efficiency.",
      activityTitle: "Recent Processing Events",
    },
    exporter: {
      title: "Export Workspace",
      subtitle: "Review export-ready inventory and active offers.",
      activityTitle: "Recent Offer Activity",
    },
    importer: {
      title: "Import Workspace",
      subtitle: "Track procurement from RFQ to contract readiness.",
      activityTitle: "Recent RFQ Activity",
    },
    bank_officer: {
      title: "Bank Workspace",
      subtitle: "Review guarantees, approvals, and exposure context.",
      activityTitle: "Recent Approval Activity",
    },
    transporter: {
      title: "Transport Workspace",
      subtitle: "Confirm custody transitions and assigned movements.",
      activityTitle: "Recent Custody Events",
    },
    lab_officer: {
      title: "Lab Workspace",
      subtitle: "Intake after transporter handoff — record, approve, or fail before export.",
      activityTitle: "Recent Lab Results",
    },
    admin: {
      title: "Admin Workspace",
      subtitle: "Oversee exceptions, integrity events, and decoder tools.",
      activityTitle: "Recent System Exceptions",
    },
  };

  const linkedActorId = useMemo(
    () => data?.users.find((user) => user.id === userId)?.linkedActorId ?? null,
    [data, userId],
  );

  const myFarms = useMemo(() => {
    if (!data || !linkedActorId) return [];
    return data.farms.filter(
      (f) =>
        (f.ownerActorId === linkedActorId || f.managerActorId === linkedActorId) &&
        f.status !== "archived",
    );
  }, [data, linkedActorId]);

  /** Farmer-origin lots validated and still held by another actor — ready for aggregator receive */
  const aggregatorReceiveCandidates = useMemo(() => {
    if (!data || !linkedActorId) return [];
    return data.lots.filter(
      (l) =>
        l.status === "in_stock" &&
        l.integrityStatus === "verified" &&
        l.currentCustodianActorId !== linkedActorId &&
        !["consumed", "cancelled", "archived", "quarantined"].includes(l.status),
    );
  }, [data, linkedActorId]);

  /** Lots currently in aggregator custody that can be combined into a new aggregate */
  const aggregatorAggregateCandidates = useMemo(() => {
    if (!data || !linkedActorId) return [];
    return data.lots.filter(
      (l) =>
        l.status === "in_stock" &&
        l.integrityStatus === "verified" &&
        l.currentCustodianActorId === linkedActorId,
    );
  }, [data, linkedActorId]);

  const processorIntakeLots = useMemo(() => {
    if (!data || !linkedActorId) return [];
    return data.lots.filter(
      (l) =>
        l.status === "in_stock" &&
        l.integrityStatus === "verified" &&
        l.currentCustodianActorId === linkedActorId,
    );
  }, [data, linkedActorId]);

  const transporterPickupCandidates = useMemo(() => {
    if (!data || !linkedActorId) return [];
    return data.lots.filter((l) => canTransporterAcceptLot(l, linkedActorId));
  }, [data, linkedActorId]);

  const transporterHandoverCandidates = useMemo(() => {
    if (!data || !linkedActorId) return [];
    return data.lots.filter((l) => canTransporterHandoverToLab(l, linkedActorId));
  }, [data, linkedActorId]);

  const transporterLotOptions = useMemo(() => {
    const m = new Map<string, (typeof transporterPickupCandidates)[0]>();
    for (const l of transporterPickupCandidates) m.set(l.id, l);
    for (const l of transporterHandoverCandidates) m.set(l.id, l);
    return [...m.values()];
  }, [transporterPickupCandidates, transporterHandoverCandidates]);

  const labIntakeLots = useMemo(() => {
    if (!data || !linkedActorId) return [];
    return data.lots.filter((l) => isLabIntakeLot(l, linkedActorId));
  }, [data, linkedActorId]);
  const processorActors = useMemo(() => {
    if (!data) return [];
    return data.actors.filter((a) => a.primaryRole === "processor");
  }, [data]);

  const exporterOfferLotCandidates = useMemo(() => {
    if (!data) return [];
    return data.lots.filter((l) => isExportTradeEligibleLot(l, data.labResults));
  }, [data]);

  const lotDetailDefaultLot = useMemo(() => {
    if (!data || !primaryRole || !linkedActorId) return null;
    if (primaryRole === "aggregator") {
      return data.lots.find((l) => l.status === "pending_validation") ?? null;
    }
    if (primaryRole === "processor") {
      return processorIntakeLots[0] ?? null;
    }
    if (primaryRole === "transporter") {
      return transporterLotOptions[0] ?? null;
    }
    if (primaryRole === "exporter") {
      return data.lots.find((l) => isExportTradeEligibleLot(l, data.labResults)) ?? null;
    }
    if (primaryRole === "lab_officer") {
      return labIntakeLots[0] ?? null;
    }
    return null;
  }, [data, labIntakeLots, linkedActorId, primaryRole, processorIntakeLots, transporterLotOptions]);

  useEffect(() => {
    if (currentState !== "admin_role_monitor") return;
    if (!monitorSelectedUserId && monitoredUsers.length) {
      setMonitorSelectedUserId(monitoredUsers[0]?.id ?? null);
      return;
    }
    if (
      monitorSelectedUserId &&
      monitoredUsers.length &&
      !monitoredUsers.some((u) => u.id === monitorSelectedUserId)
    ) {
      setMonitorSelectedUserId(monitoredUsers[0]?.id ?? null);
    }
  }, [currentState, monitorSelectedUserId, monitoredUsers]);

  const recentActivity = useMemo(() => {
    if (!data || !primaryRole || !linkedActorId) return [];
    if (primaryRole === "farmer") {
      return data.lots
        .filter((lot) => lot.originActorId === linkedActorId)
        .map((lot) => `Lot ${lot.publicLotCode} (${lot.status})`);
    }
    if (primaryRole === "aggregator" || primaryRole === "processor" || primaryRole === "transporter") {
      return data.inventoryEvents
        .filter((event) => event.actorId === linkedActorId)
        .map((event) => `${event.type} - ${event.lotId}`);
    }
    if (primaryRole === "exporter") {
      return data.offers
        .filter((offer) => offer.sellerActorId === linkedActorId)
        .map((offer) => `Offer ${offer.id}`);
    }
    if (primaryRole === "importer") {
      return data.rfqs
        .filter((rfq) => rfq.buyerActorId === linkedActorId)
        .map((rfq) => `RFQ ${rfq.uid}`);
    }
    if (primaryRole === "bank_officer") {
      return data.bankApprovals
        .filter((approval) => approval.bankActorId === linkedActorId)
        .map((approval) => `Approval ${approval.id} (${approval.status})`);
    }
    if (primaryRole === "lab_officer") {
      return data.labResults
        .filter((result) => result.labActorId === linkedActorId)
        .map((result) => `Lab ${result.sampleCode} (${result.status})`);
    }
    if (primaryRole === "admin") {
      return data.lots
        .filter((lot) => lot.integrityStatus === "compromised")
        .map((lot) => `Exception: ${lot.publicLotCode} quarantined`);
    }
    return [];
  }, [data, linkedActorId, primaryRole]);

  const latestRoleActivity = useMemo(() => {
    if (!data || !primaryRole || !linkedActorId) {
      return { title: "Latest Activity", lines: [] as string[] };
    }

    const take = (rows: string[]) => rows.slice(0, 5);

    if (primaryRole === "farmer") {
      const mine = data.lots
        .filter((l) => l.originActorId === linkedActorId)
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      return {
        title: "Latest pick lots",
        lines: take(mine.map((l) => `${l.id} · ${l.publicLotCode} · ${l.status}`)),
      };
    }

    if (primaryRole === "aggregator") {
      const mine = data.lots
        .filter((l) => l.originActorId === linkedActorId && l.sourceType === "aggregated")
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      return {
        title: "Latest aggregates",
        lines: take(mine.map((l) => `${l.id} · ${l.publicLotCode} · ${l.weightKg} kg`)),
      };
    }

    if (primaryRole === "processor") {
      const mine = data.lots
        .filter((l) => l.originActorId === linkedActorId && l.sourceType === "processed")
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      return {
        title: "Latest processed outputs",
        lines: take(mine.map((l) => `${l.id} · ${l.publicLotCode} · ${l.status}`)),
      };
    }

    if (primaryRole === "transporter") {
      const mine = data.inventoryEvents
        .filter(
          (e) =>
            e.actorId === linkedActorId &&
            (e.type === "TRANSFER_CUSTODY" || e.type === "HANDOVER_TO_LAB"),
        )
        .sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""));
      return {
        title: "Latest custody transitions",
        lines: take(mine.map((e) => `${e.id} · ${e.type} · lot ${e.lotId}`)),
      };
    }

    if (primaryRole === "lab_officer") {
      const mine = data.labResults
        .filter((r) => r.labActorId === linkedActorId)
        .sort((a, b) => (b.issuedAt ?? "").localeCompare(a.issuedAt ?? ""));
      return {
        title: "Latest lab results",
        lines: take(mine.map((r) => `${r.id} · lot ${r.lotId} · ${r.status}`)),
      };
    }

    if (primaryRole === "exporter") {
      const mine = data.offers
        .filter((o) => o.sellerActorId === linkedActorId)
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      return {
        title: "Latest offers",
        lines: take(mine.map((o) => `${o.id} · RFQ ${o.rfqId} · ${o.status}`)),
      };
    }

    if (primaryRole === "importer") {
      const mine = data.rfqs
        .filter((r) => r.buyerActorId === linkedActorId)
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      return {
        title: "Latest RFQs",
        lines: take(mine.map((r) => `${r.id} · ${r.title} · ${r.status}`)),
      };
    }

    if (primaryRole === "bank_officer") {
      const mine = data.bankApprovals
        .filter((b) => b.bankActorId === linkedActorId)
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      return {
        title: "Latest approvals",
        lines: take(mine.map((b) => `${b.id} · contract ${b.contractId} · ${b.status}`)),
      };
    }

    if (primaryRole === "admin") {
      const lots = data.lots
        .filter((l) => l.status === "quarantined" || l.integrityStatus === "compromised")
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      const events = data.inventoryEvents
        .slice()
        .sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""));
      return {
        title: "Latest system activity",
        lines: take([
          ...lots.map((l) => `${l.id} · ${l.publicLotCode} · ${l.status}/${l.integrityStatus}`),
          ...events.map((e) => `${e.id} · ${e.type} · lot ${e.lotId}`),
        ]),
      };
    }

    return { title: "Latest Activity", lines: [] as string[] };
  }, [data, linkedActorId, primaryRole]);

  const chartSpec = useMemo(() => {
    if (!data || !primaryRole) return null;
    if (primaryRole === "farmer") {
      const mine = data.lots.filter((lot) => lot.originActorId === linkedActorId);
      return {
        type: "bar",
        title: "My lot statuses",
        data: [
          { status: "Pending validation", count: mine.filter((l) => l.status === "pending_validation").length },
          { status: "In stock", count: mine.filter((l) => l.status === "in_stock").length },
          { status: "Archived/cancelled", count: mine.filter((l) => ["archived", "cancelled"].includes(l.status)).length },
        ],
      };
    }
    if (primaryRole === "aggregator") {
      return {
        type: "bar",
        title: "Aggregator chain queue",
        data: [
          { stage: "Pending validation", count: data.lots.filter((l) => l.status === "pending_validation").length },
          { stage: "Ready to receive", count: aggregatorReceiveCandidates.length },
          { stage: "In aggregator custody", count: aggregatorAggregateCandidates.length },
        ],
      };
    }
    if (primaryRole === "processor") {
      const processEvents = data.inventoryEvents.filter((e) => e.type.startsWith("PROCESS_"));
      return {
        type: "bar",
        title: "Processor throughput",
        data: [
          { metric: "Intake lots", value: processorIntakeLots.length },
          { metric: "Process events", value: processEvents.length },
          { metric: "Ready for transport", value: data.lots.filter((l) => l.status === "awaiting_transport").length },
        ],
      };
    }
    if (primaryRole === "transporter") {
      const transfers = data.inventoryEvents.filter(
        (event) =>
          event.actorId === linkedActorId &&
          (event.type.includes("TRANSFER") || event.type === "HANDOVER_TO_LAB"),
      );
      return {
        type: "bar",
        title: "Transport queue and events",
        data: [
          { metric: "Pickup queue", count: transporterPickupCandidates.length },
          { metric: "Handover queue", count: transporterHandoverCandidates.length },
          { metric: "Custody events", count: transfers.length },
        ],
      };
    }
    if (primaryRole === "lab_officer") {
      const mine = data.labResults.filter((result) => result.labActorId === linkedActorId);
      return {
        type: "bar",
        title: "Lab outcomes",
        data: [
          { outcome: "Pending", count: mine.filter((r) => r.status === "pending").length },
          { outcome: "Approved", count: mine.filter((r) => r.status === "approved" || r.status === "final").length },
          { outcome: "Failed", count: mine.filter((r) => r.status === "failed").length },
        ],
      };
    }
    if (primaryRole === "exporter") {
      const mine = data.offers.filter((offer) => offer.sellerActorId === linkedActorId);
      return {
        type: "bar",
        title: "Exporter pipeline",
        data: [
          { metric: "Eligible lots", count: data.lots.filter((l) => isExportTradeEligibleLot(l, data.labResults)).length },
          { metric: "Offers", count: mine.length },
          { metric: "Contracts", count: data.contracts.filter((ctr) => ctr.sellerActorId === linkedActorId).length },
        ],
      };
    }
    if (primaryRole === "importer") {
      return {
        type: "bar",
        title: "Importer procurement flow",
        data: [
          { metric: "RFQs", count: data.rfqs.filter((rfq) => rfq.buyerActorId === linkedActorId).length },
          { metric: "Offers", count: data.offers.length },
          { metric: "Contracts", count: data.contracts.filter((ctr) => ctr.buyerActorId === linkedActorId).length },
        ],
      };
    }
    if (primaryRole === "bank_officer") {
      const mine = data.bankApprovals.filter((approval) => approval.bankActorId === linkedActorId);
      return {
        type: "bar",
        title: "Bank approvals",
        data: [
          { status: "Pending", count: mine.filter((a) => a.status.toLowerCase().includes("pending")).length },
          { status: "Approved", count: mine.filter((a) => a.status.toLowerCase().includes("approved")).length },
          { status: "Rejected", count: mine.filter((a) => a.status.toLowerCase().includes("rejected")).length },
        ],
      };
    }
    if (primaryRole === "admin") {
      return {
        type: "bar",
        title: "System integrity and volume",
        data: [
          { metric: "Lots", count: data.lots.length },
          { metric: "Quarantined", count: data.lots.filter((l) => l.status === "quarantined").length },
          { metric: "Compromised", count: data.lots.filter((l) => l.integrityStatus === "compromised").length },
          { metric: "Events", count: data.inventoryEvents.length },
        ],
      };
    }
    return { type: "bar", title: "Role metrics", data: [] };
  }, [
    aggregatorAggregateCandidates.length,
    aggregatorReceiveCandidates.length,
    data,
    linkedActorId,
    primaryRole,
    processorIntakeLots.length,
    transporterPickupCandidates.length,
    transporterHandoverCandidates.length,
  ]);

  const kpiCards = useMemo(() => {
    if (!data || !primaryRole || !linkedActorId) {
      return [];
    }

    if (primaryRole === "farmer") {
      const mine = data.lots.filter((lot) => lot.originActorId === linkedActorId);
      return [
        { label: "My Fields", value: myFarms.length },
        { label: "My Lots", value: mine.length },
        { label: "Pending Validation", value: mine.filter((lot) => lot.status === "pending_validation").length },
        { label: "Total Picked (kg)", value: Math.round(mine.reduce((sum, lot) => sum + lot.weightKg, 0)) },
      ];
    }

    if (primaryRole === "aggregator") {
      return [
        { label: "Pending farmer picks", value: data.lots.filter((lot) => lot.status === "pending_validation").length },
        { label: "Ready to receive (queue)", value: aggregatorReceiveCandidates.length },
        { label: "In your custody", value: aggregatorAggregateCandidates.length },
        {
          label: "Validation events",
          value: data.inventoryEvents.filter((event) => event.type === "VALIDATE_PICK").length,
        },
      ];
    }

    if (primaryRole === "processor") {
      return [
        { label: "Intake (your custody)", value: processorIntakeLots.length },
        { label: "In stock (all)", value: data.lots.filter((lot) => lot.status === "in_stock").length },
        { label: "Ready for export", value: data.lots.filter((lot) => lot.status === "ready_for_export").length },
        {
          label: "Processing events",
          value: data.inventoryEvents.filter((event) => event.type === "PROCESS_PULP_AND_WASH").length,
        },
      ];
    }

    if (primaryRole === "exporter") {
      const eligible = data.lots.filter((lot) => isExportTradeEligibleLot(lot, data.labResults));
      return [
        { label: "Lab-cleared / export-eligible", value: eligible.length },
        { label: "Submitted Offers", value: data.offers.filter((offer) => offer.sellerActorId === linkedActorId).length },
        { label: "Linked Contracts", value: data.contracts.filter((ctr) => ctr.sellerActorId === linkedActorId).length },
        { label: "Reserved lots", value: eligible.filter((l) => l.status === "contract_reserved").length },
      ];
    }

    if (primaryRole === "importer") {
      return [
        { label: "Open RFQs", value: data.rfqs.filter((rfq) => rfq.buyerActorId === linkedActorId).length },
        { label: "Active Contracts", value: data.contracts.filter((ctr) => ctr.buyerActorId === linkedActorId).length },
        { label: "Offers Received", value: data.offers.length },
        { label: "Recent Activity", value: recentActivity.length },
      ];
    }

    if (primaryRole === "bank_officer") {
      return [
        {
          label: "Approvals",
          value: data.bankApprovals.filter((approval) => approval.bankActorId === linkedActorId).length,
        },
        {
          label: "Approved",
          value: data.bankApprovals.filter((approval) => approval.status.toLowerCase().includes("approved")).length,
        },
        { label: "Contracts In Review", value: data.contracts.filter((ctr) => ctr.status === "bank_review").length },
        { label: "Recent Activity", value: recentActivity.length },
      ];
    }

    if (primaryRole === "transporter") {
      return [
        { label: "Pickup queue (awaiting transport)", value: transporterPickupCandidates.length },
        { label: "Handover to lab (in your custody)", value: transporterHandoverCandidates.length },
        { label: "Your custody lots", value: data.lots.filter((lot) => lot.currentCustodianActorId === linkedActorId).length },
        {
          label: "Custody events",
          value: data.inventoryEvents.filter((event) => event.type.includes("TRANSFER_CUSTODY")).length,
        },
      ];
    }

    if (primaryRole === "lab_officer") {
      const mine = data.labResults.filter((result) => result.labActorId === linkedActorId);
      return [
        { label: "Lab intake queue", value: labIntakeLots.length },
        { label: "Draft results (pending)", value: mine.filter((r) => r.status === "pending").length },
        { label: "Approved", value: mine.filter((r) => r.status === "approved" || r.status === "final").length },
        { label: "Failed", value: mine.filter((r) => r.status === "failed").length },
      ];
    }

    if (primaryRole === "admin") {
      return [
        { label: "Total lots (live)", value: data.lots.length },
        { label: "Compromised lots", value: data.lots.filter((lot) => lot.integrityStatus === "compromised").length },
        { label: "Quarantined", value: data.lots.filter((lot) => lot.status === "quarantined").length },
        { label: "Inventory events", value: data.inventoryEvents.length },
      ];
    }

    return [];
  }, [
    aggregatorAggregateCandidates.length,
    aggregatorReceiveCandidates.length,
    data,
    linkedActorId,
    primaryRole,
    processorIntakeLots.length,
    labIntakeLots.length,
    transporterHandoverCandidates.length,
    transporterPickupCandidates.length,
    myFarms.length,
  ]);

  useEffect(() => {
    if (!processorIntakeLots.length) {
      setProcessorLotPick("");
      return;
    }
    setProcessorLotPick((prev) =>
      prev && processorIntakeLots.some((l) => l.id === prev) ? prev : processorIntakeLots[0].id,
    );
  }, [processorIntakeLots]);

  useEffect(() => {
    if (!transporterLotOptions.length) {
      setTransporterLotPick("");
      return;
    }
    setTransporterLotPick((prev) =>
      prev && transporterLotOptions.some((l) => l.id === prev) ? prev : transporterLotOptions[0].id,
    );
  }, [transporterLotOptions]);

  useEffect(() => {
    if (!aggregatorReceiveCandidates.length) {
      setAggReceiveLotId("");
      return;
    }
    setAggReceiveLotId((prev) =>
      prev && aggregatorReceiveCandidates.some((l) => l.id === prev) ? prev : aggregatorReceiveCandidates[0].id,
    );
  }, [aggregatorReceiveCandidates]);

  useEffect(() => {
    if (!processorActors.length) {
      setAggProcessorActorId("");
      return;
    }
    setAggProcessorActorId((prev) =>
      prev && processorActors.some((a) => a.id === prev) ? prev : processorActors[0]!.id,
    );
  }, [processorActors]);

  if (currentState === "loading") {
    return <ScreenCard title="Loading" description="Initializing app engine and local mock data." />;
  }

  if (currentState === "auth_login") {
    return (
      <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Login</h1>
        <p className="mt-2 text-sm text-zinc-600">Use email or phone, then continue to OTP.</p>
        <div className="mt-6 space-y-4">
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Email or phone"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              const result = attemptLogin(identifier, password);
              if (!result.ok) {
                setError(result.message ?? "Login failed.");
                return;
              }
              setError(null);
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  if (currentState === "auth_otp") {
    return (
      <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">One-Time Password</h1>
        <p className="mt-2 text-sm text-zinc-600">
          {pendingUser
            ? `Enter the 6-digit OTP for ${pendingUser.fullName}.`
            : "Session expired. Return to login."}
        </p>
        <div className="mt-6 space-y-4">
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="6-digit OTP"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              const result = verifyOtp(otp);
              if (!result.ok) {
                setError(result.message ?? "OTP validation failed.");
                return;
              }
              setError(null);
            }}
          >
            Verify
          </Button>
        </div>
      </div>
    );
  }

  if (currentState === "farmer_fields" && primaryRole === "farmer" && data && linkedActorId) {
    return (
      <div className="mx-auto mt-6 w-full max-w-2xl space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">My fields</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {myFarms.length} active field{myFarms.length === 1 ? "" : "s"} linked to your actor.
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center text-sm text-zinc-500">
          Map preview placeholder — GPS and polygon summaries appear per field below.
        </div>
        <div className="space-y-2">
          {myFarms.map((farm) => (
            <details key={farm.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">{farm.name}</summary>
              <div className="mt-2 space-y-1 text-sm text-zinc-600">
                <p>
                  GPS: {farm.coordinates.lat.toFixed(4)}, {farm.coordinates.lng.toFixed(4)}
                </p>
                <p>Polygon vertices: {farm.polygon?.length ?? 0}</p>
                <p>
                  {farm.region} / {farm.zone} / {farm.woreda} / {farm.kebele}
                </p>
              </div>
              <Button
                type="button"
                className="mt-3 w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                onClick={() => openFarmerFieldEdit(farm.id)}
              >
                Edit field
              </Button>
            </details>
          ))}
        </div>
        <Button type="button" className="w-full" onClick={() => goToState("farmer_field_new")}>
          Add field
        </Button>
        <Button type="button" className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100" onClick={() => goToState("dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  if (currentState === "farmer_field_new" && primaryRole === "farmer" && !linkedActorId) {
    return (
      <ScreenCard
        title="Session required"
        description="Sign in as a farmer with a linked actor to add a field."
      />
    );
  }

  if (currentState === "farmer_field_new" && primaryRole === "farmer" && linkedActorId) {
    const latN = Number(fieldForm.lat);
    const lngN = Number(fieldForm.lng);
    const centerLat = Number.isFinite(latN) ? latN : 6.6;
    const centerLng = Number.isFinite(lngN) ? lngN : 38.4;
    const polygonForMap = fieldMapPolygon.length >= 3 ? fieldMapPolygon : null;

    return (
      <div className="mx-auto mt-10 w-full max-w-3xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">New field</h1>
        <p className="text-sm text-zinc-600">
          Set location details, then draw your field boundary on the map. Drag the pin for the main GPS
          point. Boundary is optional; you can save with a point only.
        </p>
        <div className="space-y-3">
          {(
            [
              ["name", "Field name"],
              ["region", "Region"],
              ["zone", "Zone"],
              ["woreda", "Woreda"],
              ["kebele", "Kebele"],
            ] as const
          ).map(([k, label]) => (
            <input
              key={k}
              value={fieldForm[k as keyof typeof fieldForm] as string}
              onChange={(e) => setFieldForm((f) => ({ ...f, [k]: e.target.value }))}
              placeholder={label}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
            />
          ))}
          <input
            value={fieldForm.country}
            onChange={(e) => setFieldForm((f) => ({ ...f, country: e.target.value }))}
            placeholder="Country"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              inputMode="decimal"
              value={fieldForm.lat}
              onChange={(e) => setFieldForm((f) => ({ ...f, lat: e.target.value }))}
              placeholder="Latitude"
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
            />
            <input
              inputMode="decimal"
              value={fieldForm.lng}
              onChange={(e) => setFieldForm((f) => ({ ...f, lng: e.target.value }))}
              placeholder="Longitude"
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
            />
          </div>
          <FarmerFieldMapPicker
            centerLat={centerLat}
            centerLng={centerLng}
            polygon={polygonForMap}
            onPolygonChange={setFieldMapPolygon}
            onFieldPointChange={(la, ln) => {
              setFieldForm((f) => ({ ...f, lat: String(la), lng: String(ln) }));
            }}
          />
          <Button
            type="button"
            className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
            onClick={() => setFieldMapPolygon([])}
          >
            Clear boundary
          </Button>
          <input
            inputMode="decimal"
            value={fieldForm.elevationM}
            onChange={(e) => setFieldForm((f) => ({ ...f, elevationM: e.target.value }))}
            placeholder="Elevation (m)"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
          />
          <input
            inputMode="decimal"
            value={fieldForm.sizeHectares}
            onChange={(e) => setFieldForm((f) => ({ ...f, sizeHectares: e.target.value }))}
            placeholder="Size (hectares)"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
          />
          <input
            value={fieldForm.farmingType}
            onChange={(e) => setFieldForm((f) => ({ ...f, farmingType: e.target.value }))}
            placeholder="Farming type"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
          />
          <input
            value={fieldForm.varieties}
            onChange={(e) => setFieldForm((f) => ({ ...f, varieties: e.target.value }))}
            placeholder="Coffee varieties (comma-separated)"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
          />
          <input
            value={fieldForm.eudrStatus}
            onChange={(e) => setFieldForm((f) => ({ ...f, eudrStatus: e.target.value }))}
            placeholder="EUDR status"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
          />
          <details className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <summary className="cursor-pointer text-sm font-medium">Advanced: import polygon JSON</summary>
            <p className="mt-1 text-xs text-zinc-500">
              Used only if you have not drawn at least three vertices on the map.
            </p>
            <textarea
              value={fieldForm.polygonText}
              onChange={(e) => setFieldForm((f) => ({ ...f, polygonText: e.target.value }))}
              placeholder='[[38.47,6.62],[38.48,6.63],...] as [lng,lat][]'
              rows={4}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs"
            />
          </details>
          <textarea
            value={fieldForm.notes}
            onChange={(e) => setFieldForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Notes"
            rows={2}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            let polygon: [number, number][] | undefined;
            if (fieldMapPolygon.length >= 3) {
              polygon = fieldMapPolygon;
            } else if (fieldForm.polygonText.trim()) {
              try {
                const parsedJson = JSON.parse(fieldForm.polygonText) as unknown;
                if (!Array.isArray(parsedJson)) throw new Error("Polygon must be an array");
                polygon = parsedJson as [number, number][];
              } catch {
                setError("Invalid polygon JSON.");
                return;
              }
            }
            const parsed = farmFieldFormSchema.safeParse({
              name: fieldForm.name,
              region: fieldForm.region,
              zone: fieldForm.zone,
              woreda: fieldForm.woreda,
              kebele: fieldForm.kebele,
              country: fieldForm.country,
              elevationM: Number(fieldForm.elevationM),
              sizeHectares: Number(fieldForm.sizeHectares),
              coffeeVarieties: fieldForm.varieties.split(",").map((s) => s.trim()).filter(Boolean),
              farmingType: fieldForm.farmingType,
              coordinates: { lat: Number(fieldForm.lat), lng: Number(fieldForm.lng) },
              polygon,
              eudrStatus: fieldForm.eudrStatus,
              notes: fieldForm.notes || undefined,
            });
            if (!parsed.success) {
              setError(parsed.error.issues.map((i) => i.message).join("; "));
              return;
            }
            const r = createFarmField({
              ...parsed.data,
              polygon: parsed.data.polygon ?? [],
              ownerActorId: linkedActorId,
              managerActorId: linkedActorId,
              organizationId: data?.users.find((u) => u.id === userId)?.organizationId ?? "org_unknown",
              status: "active",
            });
            if (!r.ok) {
              setError(r.message);
              return;
            }
            setError(null);
            goToState("farmer_fields");
          }}
        >
          Save field
        </Button>
        <Button type="button" className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100" onClick={() => goToState("farmer_fields")}>
          Cancel
        </Button>
      </div>
    );
  }

  if (currentState === "farmer_field_edit" && primaryRole === "farmer" && data && selectedFarmId) {
    const ef = data.farms.find((f) => f.id === selectedFarmId);
    if (!ef) {
      return (
        <ScreenCard title="Field not found" description="Return to your field list." />
      );
    }
    return (
      <FarmerFieldEditForm
        ef={ef}
        selectedFarmId={selectedFarmId}
        updateFarmField={updateFarmField}
        archiveFarmField={archiveFarmField}
        goToState={goToState}
      />
    );
  }

  if (currentState === "farmer_my_lots" && primaryRole === "farmer" && data && linkedActorId) {
    const mine = data.lots.filter((l) => l.originActorId === linkedActorId);
    return (
      <div className="mx-auto mt-6 w-full max-w-2xl space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">My lots</h1>
          <p className="mt-1 text-sm text-zinc-600">Open a lot for full trace detail.</p>
        </div>
        {mine.map((lot) => (
          <div key={lot.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="font-mono text-sm text-zinc-900">{lot.publicLotCode}</p>
            <p className="text-sm text-zinc-600">
              {lot.status} · {lot.weightKg} kg · {lot.form}
            </p>
            <Button type="button" className="mt-3 w-full" onClick={() => openLotDetail(lot.id)}>
              Open lot
            </Button>
          </div>
        ))}
        <Button type="button" className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100" onClick={() => goToState("dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  if (currentState === "importer_rfq_new" && primaryRole === "importer") {
    return (
      <div className="mx-auto mt-10 w-full max-w-xl space-y-3 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">New RFQ draft</h1>
        <input
          value={importerRfqForm.title}
          onChange={(e) => setImporterRfqForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Title"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <input
          value={importerRfqForm.commodity}
          onChange={(e) => setImporterRfqForm((f) => ({ ...f, commodity: e.target.value }))}
          placeholder="Commodity"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <input
          value={importerRfqForm.form}
          onChange={(e) => setImporterRfqForm((f) => ({ ...f, form: e.target.value }))}
          placeholder="Form"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <div className="flex gap-2">
          <input
            value={importerRfqForm.targetQuantityKg}
            onChange={(e) => setImporterRfqForm((f) => ({ ...f, targetQuantityKg: e.target.value }))}
            placeholder="Target quantity"
            className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
          />
          <select
            value={importerQuantityUnit}
            onChange={(e) => setImporterQuantityUnit(e.target.value as MassUnit)}
            className="w-24 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm"
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>
        <input
          value={importerRfqForm.minimumGrade}
          onChange={(e) => setImporterRfqForm((f) => ({ ...f, minimumGrade: e.target.value }))}
          placeholder="Min grade"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <input
          value={importerRfqForm.originPreference}
          onChange={(e) => setImporterRfqForm((f) => ({ ...f, originPreference: e.target.value }))}
          placeholder="Origin (comma)"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <input
          value={importerRfqForm.incoterm}
          onChange={(e) => setImporterRfqForm((f) => ({ ...f, incoterm: e.target.value }))}
          placeholder="Incoterm"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <input
          value={importerRfqForm.deliveryWindowStart}
          onChange={(e) => setImporterRfqForm((f) => ({ ...f, deliveryWindowStart: e.target.value }))}
          placeholder="Window start"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <input
          value={importerRfqForm.deliveryWindowEnd}
          onChange={(e) => setImporterRfqForm((f) => ({ ...f, deliveryWindowEnd: e.target.value }))}
          placeholder="Window end"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            const parsed = rfqDraftSchema.safeParse({
              title: importerRfqForm.title,
              commodity: importerRfqForm.commodity,
              form: importerRfqForm.form,
              targetQuantityKg: toKg(Number(importerRfqForm.targetQuantityKg), importerQuantityUnit),
              minimumGrade: importerRfqForm.minimumGrade,
              originPreference: importerRfqForm.originPreference.split(",").map((s) => s.trim()).filter(Boolean),
              incoterm: importerRfqForm.incoterm,
              deliveryWindowStart: importerRfqForm.deliveryWindowStart,
              deliveryWindowEnd: importerRfqForm.deliveryWindowEnd,
            });
            if (!parsed.success) {
              setError(parsed.error.issues.map((i) => i.message).join("; "));
              return;
            }
            const r = createImporterRfq({ ...parsed.data, invitedActorIds: [], participationRule: "open", minimumTrustScore: 0 });
            if (!r.ok) setError(r.message);
            else {
              setError(null);
              goToState("rfq_list");
            }
          }}
        >
          Create draft
        </Button>
        <Button type="button" className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100" onClick={() => goToState("rfq_list")}>
          Cancel
        </Button>
      </div>
    );
  }

  if (currentState === "rfq_edit" && primaryRole === "importer" && selectedRfq) {
    return (
      <div className="mx-auto mt-10 w-full max-w-xl space-y-3 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Edit RFQ</h1>
        <p className="text-sm text-zinc-600">{selectedRfq.title}</p>
        <input
          value={importerRfqForm.title || selectedRfq.title}
          onChange={(e) => setImporterRfqForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            const r = updateImporterRfq(selectedRfq.id, { title: importerRfqForm.title || selectedRfq.title });
            if (!r.ok) setError(r.message);
            else {
              setError(null);
              openRfqDetail(selectedRfq.id);
            }
          }}
        >
          Save draft
        </Button>
        <Button
          type="button"
          className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
          onClick={() => {
            archiveImporterRfq(selectedRfq.id);
            goToState("rfq_list");
          }}
        >
          Archive draft
        </Button>
      </div>
    );
  }

  if (currentState === "exporter_offer_new" && primaryRole === "exporter" && data) {
    return (
      <div className="mx-auto mt-10 w-full max-w-xl space-y-3 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">New offer draft</h1>
        <select
          value={exporterOfferForm.rfqId}
          onChange={(e) => setExporterOfferForm((f) => ({ ...f, rfqId: e.target.value }))}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        >
          <option value="">Select RFQ</option>
          {data.rfqs.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
        <select
          value={exporterOfferForm.linkedLotId}
          onChange={(e) => setExporterOfferForm((f) => ({ ...f, linkedLotId: e.target.value }))}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        >
          <option value="">Select lot</option>
          {exporterOfferLotCandidates.map((l) => (
            <option key={l.id} value={l.id}>
              {l.publicLotCode} · {l.status} · {l.weightKg} kg
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            value={exporterOfferForm.offeredQuantityKg}
            onChange={(e) => setExporterOfferForm((f) => ({ ...f, offeredQuantityKg: e.target.value }))}
            placeholder="Quantity"
            className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
          />
          <select
            value={exporterQuantityUnit}
            onChange={(e) => setExporterQuantityUnit(e.target.value as MassUnit)}
            className="w-24 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm"
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>
        <input
          value={exporterOfferForm.pricePerKgUsd}
          onChange={(e) => setExporterOfferForm((f) => ({ ...f, pricePerKgUsd: e.target.value }))}
          placeholder="Price USD/kg"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <input
          value={exporterOfferForm.currency}
          onChange={(e) => setExporterOfferForm((f) => ({ ...f, currency: e.target.value }))}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            const parsed = offerDraftSchema.safeParse({
              rfqId: exporterOfferForm.rfqId,
              offeredQuantityKg: toKg(Number(exporterOfferForm.offeredQuantityKg), exporterQuantityUnit),
              pricePerKgUsd: Number(exporterOfferForm.pricePerKgUsd),
              currency: exporterOfferForm.currency,
              linkedLotIds: exporterOfferForm.linkedLotId ? [exporterOfferForm.linkedLotId] : [],
            });
            if (!parsed.success) {
              setError(parsed.error.issues.map((i) => i.message).join("; "));
              return;
            }
            const r = createExporterOffer(parsed.data);
            if (!r.ok) setError(r.message);
            else {
              setError(null);
              goToState("dashboard");
            }
          }}
        >
          Save offer
        </Button>
        <Button type="button" className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100" onClick={() => goToState("dashboard")}>
          Cancel
        </Button>
      </div>
    );
  }

  if (currentState === "bank_approval_edit" && primaryRole === "bank_officer" && selectedBankApproval) {
    const b = selectedBankApproval;
    return (
      <div className="mx-auto mt-10 w-full max-w-xl space-y-3 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Edit approval</h1>
        <p className="text-sm text-zinc-600">Contract {b.contractId}</p>
        <input
          value={bankEditForm.guaranteeType || b.guaranteeType}
          onChange={(e) => setBankEditForm((f) => ({ ...f, guaranteeType: e.target.value }))}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <input
          value={bankEditForm.guaranteeStatus || b.guaranteeStatus}
          onChange={(e) => setBankEditForm((f) => ({ ...f, guaranteeStatus: e.target.value }))}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <input
          value={bankEditForm.status || b.status}
          onChange={(e) => setBankEditForm((f) => ({ ...f, status: e.target.value }))}
          placeholder="Row status"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <textarea
          value={bankEditForm.exposureNotes}
          onChange={(e) => setBankEditForm((f) => ({ ...f, exposureNotes: e.target.value }))}
          placeholder="Exposure notes"
          rows={3}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            const r = updateBankApprovalRecord(b.id, {
              guaranteeType: bankEditForm.guaranteeType || b.guaranteeType,
              guaranteeStatus: bankEditForm.guaranteeStatus || b.guaranteeStatus,
              status: bankEditForm.status || b.status,
              exposureNotes: bankEditForm.exposureNotes || b.exposureNotes,
            });
            if (!r.ok) setError(r.message);
            else {
              setError(null);
              goToState("bank_review");
            }
          }}
        >
          Save
        </Button>
        <Button type="button" className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100" onClick={() => goToState("bank_review")}>
          Back
        </Button>
      </div>
    );
  }

  if (currentState === "lab_queue" && primaryRole === "lab_officer" && data && linkedActorId) {
    return (
      <div className="mx-auto mt-6 w-full max-w-xl space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Lab intake queue</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Lots arrive here after a transporter records handover to the lab. Record a pending result, then approve or
            fail to release (or block) export.
          </p>
        </div>
        {labIntakeLots.length ? (
          <div className="space-y-2">
            {labIntakeLots.map((l) => {
              const draft = data.labResults.find(
                (r) => r.lotId === l.id && r.labActorId === linkedActorId && r.status === "pending",
              );
              return (
                <div key={l.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <p className="font-mono text-sm text-zinc-900">{l.publicLotCode}</p>
                  <p className="text-xs text-zinc-500">
                    {l.weightKg} kg · {l.form}
                  </p>
                  <div className="mt-3 space-y-2">
                    <Button type="button" className="w-full" onClick={() => openLotDetail(l.id)}>
                      Open lot detail
                    </Button>
                    {draft ? (
                      <Button
                        type="button"
                        className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                        onClick={() => openLabResultEdit(draft.id)}
                      >
                        Continue draft result
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                        onClick={() => openLotDetail(l.id)}
                      >
                        Open lot to record result
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
            No lots in lab intake. Complete processor output, transporter pickup, then handover to lab.
          </div>
        )}
        <Button type="button" className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100" onClick={() => goToState("dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  if (currentState === "lab_result_edit" && primaryRole === "lab_officer" && data && linkedActorId) {
    const editing = selectedLabResultId ? data.labResults.find((l) => l.id === selectedLabResultId) : null;
    return (
      <div className="mx-auto mt-10 w-full max-w-xl space-y-3 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">{editing ? "Edit lab result" : "New lab result"}</h1>
        {!editing ? (
          <div className="space-y-2 text-sm text-zinc-600">
            <p>Select lot and contract from current data.</p>
            <select
              id="lab-lot"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
              defaultValue=""
            >
              <option value="">Select intake lot</option>
              {labIntakeLots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.publicLotCode} · {l.weightKg} kg
                </option>
              ))}
            </select>
            <select id="lab-ctr" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
              <option value="">No contract (optional)</option>
              {data.contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.uid}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <input
          value={labEditForm.sampleCode || editing?.sampleCode || ""}
          onChange={(e) => setLabEditForm((f) => ({ ...f, sampleCode: e.target.value }))}
          placeholder="Sample code"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <input
          value={labEditForm.moisturePercent}
          onChange={(e) => setLabEditForm((f) => ({ ...f, moisturePercent: e.target.value }))}
          placeholder="Moisture %"
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <input
          value={labEditForm.screenSize}
          onChange={(e) => setLabEditForm((f) => ({ ...f, screenSize: e.target.value }))}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <input
          value={labEditForm.defectCount}
          onChange={(e) => setLabEditForm((f) => ({ ...f, defectCount: e.target.value }))}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <input
          value={labEditForm.cupScore}
          onChange={(e) => setLabEditForm((f) => ({ ...f, cupScore: e.target.value }))}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <input
          value={labEditForm.gradeConfirmed}
          onChange={(e) => setLabEditForm((f) => ({ ...f, gradeConfirmed: e.target.value }))}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            const lotEl = document.getElementById("lab-lot") as HTMLSelectElement | null;
            const ctrEl = document.getElementById("lab-ctr") as HTMLSelectElement | null;
            const parsed = labResultFormSchema.safeParse({
              lotId: editing?.lotId ?? lotEl?.value ?? "",
              contractId: editing?.contractId ?? ctrEl?.value ?? "",
              sampleCode: labEditForm.sampleCode || editing?.sampleCode || "SMP",
              moisturePercent: Number(labEditForm.moisturePercent),
              screenSize: labEditForm.screenSize,
              defectCount: Number(labEditForm.defectCount),
              cupScore: Number(labEditForm.cupScore),
              gradeConfirmed: labEditForm.gradeConfirmed,
            });
            if (!parsed.success) {
              setError(parsed.error.issues.map((i) => i.message).join("; "));
              return;
            }
            if (editing) {
              const r = updateLabResultRecord(editing.id, parsed.data);
              if (!r.ok) setError(r.message);
              else goToState("lab_result");
            } else {
              const r = createLabResultRecord(parsed.data);
              if (!r.ok) setError(r.message);
              else goToState("dashboard");
            }
          }}
        >
          Save
        </Button>
        {editing && editing.status === "pending" ? (
          <div className="space-y-2">
            <Button
              type="button"
              className="w-full bg-emerald-700 text-white hover:bg-emerald-800"
              onClick={() => {
                const r = finalizeLabResultRecord(editing.id, "approved");
                if (r.ok) goToState("lab_queue");
                else setError(r.message);
              }}
            >
              Approve &amp; finalize (release to export)
            </Button>
            <Button
              type="button"
              className="w-full border border-red-300 bg-red-50 text-red-900 hover:bg-red-100"
              onClick={() => {
                const r = finalizeLabResultRecord(editing.id, "failed");
                if (r.ok) goToState("lab_queue");
                else setError(r.message);
              }}
            >
              Fail &amp; finalize (block export)
            </Button>
          </div>
        ) : null}
        <Button type="button" className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100" onClick={() => goToState("dashboard")}>
          Back
        </Button>
      </div>
    );
  }

  if (currentState === "aggregator_receive" && primaryRole === "aggregator" && data) {
    return (
      <div className="mx-auto mt-10 w-full max-w-xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Receive lot</h1>
        <p className="text-sm text-zinc-600">
          Lots appear here after a farmer pick is validated (in stock, verified) and still held by the prior
          custodian. Recording receive moves custody to you.
        </p>
        {aggregatorReceiveCandidates.length ? (
          <select
            value={aggReceiveLotId}
            onChange={(e) => setAggReceiveLotId(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
          >
            {aggregatorReceiveCandidates.map((l) => (
              <option key={l.id} value={l.id}>
                {l.publicLotCode} · {l.weightKg} kg · {l.form}
              </option>
            ))}
          </select>
        ) : (
          <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            No incoming lots in queue. Create a farmer pick, validate it as aggregator from the lot screen, then
            return here.
          </p>
        )}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          type="button"
          className="w-full"
          disabled={!aggReceiveLotId}
          onClick={() => {
            const r = receiveLotAsAggregator(aggReceiveLotId);
            if (!r.ok) setError(r.message);
            else {
              setError(null);
              goToState("dashboard");
            }
          }}
        >
          Record receive
        </Button>
        <Button type="button" className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100" onClick={() => goToState("dashboard")}>
          Back
        </Button>
      </div>
    );
  }

  if (currentState === "aggregator_aggregate" && primaryRole === "aggregator" && data) {
    const toggleAggParent = (id: string) => {
      setAggSelectedParentIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    };
    return (
      <div className="mx-auto mt-10 w-full max-w-xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Aggregate lots</h1>
        <p className="text-sm text-zinc-600">
          Select one or more lots already in your custody. Parent links are stored on the new aggregate lot.
        </p>
        <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          {aggregatorAggregateCandidates.length ? (
            aggregatorAggregateCandidates.map((l) => (
              <label
                key={l.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm"
              >
                <input
                  type="checkbox"
                  checked={aggSelectedParentIds.includes(l.id)}
                  onChange={() => toggleAggParent(l.id)}
                />
                <span className="font-mono text-xs">{l.publicLotCode}</span>
                <span className="text-zinc-500">
                  {l.weightKg} kg · {l.form}
                </span>
              </label>
            ))
          ) : (
            <p className="text-sm text-zinc-600">No lots in your custody yet. Receive lots first.</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={aggWeight}
            onChange={(e) => setAggWeight(e.target.value)}
            placeholder="Output weight"
            className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
          />
          <select
            value={aggWeightUnit}
            onChange={(e) => setAggWeightUnit(e.target.value as MassUnit)}
            className="w-24 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm"
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={aggSendToProcessor}
            onChange={(e) => setAggSendToProcessor(e.target.checked)}
          />
          Hand over aggregate to processor intake now
        </label>
        {aggSendToProcessor ? (
          <select
            value={aggProcessorActorId}
            onChange={(e) => setAggProcessorActorId(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
          >
            {processorActors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.displayName} ({a.id})
              </option>
            ))}
          </select>
        ) : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            const r = createAggregatedLot(
              aggSelectedParentIds,
              toKg(Number(aggWeight), aggWeightUnit),
              undefined,
              {
                handoverToProcessor: aggSendToProcessor,
                processorActorId: aggSendToProcessor ? aggProcessorActorId || null : null,
              },
            );
            if (!r.ok) setError(r.message);
            else {
              setError(null);
              setAggSelectedParentIds([]);
              setAggSendToProcessor(true);
              goToState("dashboard");
            }
          }}
        >
          Create aggregate
        </Button>
        <Button type="button" className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100" onClick={() => goToState("dashboard")}>
          Back
        </Button>
      </div>
    );
  }

  if (currentState === "admin_data_hub" && primaryRole === "admin" && data) {
    const key = adminDataEntity ?? "lots";
    const raw = data[key as keyof MockDataBundle];
    const list = Array.isArray(raw)
      ? (raw as { id: string }[]).filter((row) =>
          adminSearch.trim()
            ? JSON.stringify(row).toLowerCase().includes(adminSearch.toLowerCase())
            : true,
        )
      : [];
    return (
      <div className="mx-auto mt-6 w-full max-w-3xl space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Data management</h1>
          <p className="mt-1 text-sm text-zinc-600">Search and archive runtime records (soft).</p>
        </div>
        <select
          value={key}
          onChange={(e) => setAdminDataEntity(e.target.value as keyof LiveDataBundle)}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        >
          {(
            [
              "farms",
              "facilities",
              "lots",
              "inventoryEvents",
              "rfqs",
              "contracts",
              "bankApprovals",
              "labResults",
            ] as const
          ).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <input
          value={adminSearch}
          onChange={(e) => setAdminSearch(e.target.value)}
          placeholder="Search in JSON..."
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
        />
        <div className="max-h-80 space-y-2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-3">
          {list.slice(0, 40).map((row: { id: string }) => (
            <div key={row.id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-xs">
              <span className="font-mono text-zinc-800">{row.id}</span>
              <Button
                type="button"
                className="h-7 border border-zinc-200 bg-white px-2 text-xs text-zinc-900 hover:bg-zinc-100"
                onClick={() => adminArchiveEntity(key, row.id)}
              >
                Archive
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" className="w-full" onClick={() => goToState("dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  if (currentState === "admin_role_monitor") {
    if (primaryRole !== "admin" || !data) {
      return (
        <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-red-300 bg-red-50 p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-red-800">Role Monitor Restricted</h1>
          <p className="mt-2 text-sm text-red-700">Only admin users can access Role Monitor.</p>
          <div className="mt-6">
            <Button type="button" className="w-full" onClick={() => goToState("dashboard")}>
              Back To Dashboard
            </Button>
          </div>
        </div>
      );
    }

    const selectedMonitorUser =
      monitoredUsers.find((u) => u.id === monitorSelectedUserId) ?? filteredMonitoredUsers[0] ?? null;
    const previewNamespace = `monitor-${monitorPreviewResetCounter}`;
    const previewUrl = selectedMonitorUser
      ? `/monitor-preview?ns=${encodeURIComponent(previewNamespace)}&email=${encodeURIComponent(
          selectedMonitorUser.email,
        )}&password=${encodeURIComponent(selectedMonitorUser.password)}&role=${encodeURIComponent(selectedMonitorUser.primaryRole)}&userId=${encodeURIComponent(
          selectedMonitorUser.id,
        )}&autoLogin=${monitorAutoLogin ? "1" : "0"}`
      : `/monitor-preview?ns=${encodeURIComponent(previewNamespace)}`;

    return (
      <div className="mx-auto mt-6 w-full max-w-6xl space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Role Monitor</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Observe role experiences in an isolated embedded session while staying logged in as admin.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <input
              value={monitorSearch}
              onChange={(e) => setMonitorSearch(e.target.value)}
              placeholder="Search role / user / email"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
            />
            <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {filteredMonitoredUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setMonitorSelectedUserId(u.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selectedMonitorUser?.id === u.id
                      ? "border-zinc-900 bg-zinc-100"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide text-zinc-500">{u.primaryRole}</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">{u.fullName}</p>
                  <p className="text-xs text-zinc-600">{u.email}</p>
                </button>
              ))}
              {!filteredMonitoredUsers.length ? (
                <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
                  No users match your search.
                </p>
              ) : null}
            </div>
          </aside>

          <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  {selectedMonitorUser
                    ? `${selectedMonitorUser.fullName} · ${selectedMonitorUser.primaryRole}`
                    : "No preview target selected"}
                </p>
                <p className="text-xs text-zinc-500">
                  This preview runs as an isolated monitored session.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                  onClick={() => setMonitorPreviewReload((x) => x + 1)}
                >
                  Reload preview
                </Button>
                <Button
                  type="button"
                  className="border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                  onClick={() => {
                    setMonitorPreviewResetCounter((x) => x + 1);
                    setMonitorPreviewReload((x) => x + 1);
                  }}
                >
                  Reset preview session
                </Button>
                <Button
                  type="button"
                  className="border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                  onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}
                >
                  Open in tab
                </Button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={monitorAutoLogin}
                onChange={(e) => setMonitorAutoLogin(e.target.checked)}
              />
              Auto-login selected preview user
            </label>

            <div className="h-[70vh] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
              {selectedMonitorUser ? (
                <iframe
                  key={`${previewUrl}|${monitorPreviewReload}`}
                  src={previewUrl}
                  title={`Role monitor preview ${selectedMonitorUser.email}`}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-sm text-zinc-500">
                  Select a monitored role to open the preview.
                </div>
              )}
            </div>
          </section>
        </div>
        <Button type="button" className="w-full" onClick={() => goToState("dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  if (currentState === "dashboard") {
    const hero = primaryRole ? roleHero[primaryRole] : null;
    if (primaryRole === "admin") {
      return (
        <div className="mx-auto mt-6 w-full max-w-6xl space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-zinc-900">{hero?.title ?? "Admin Workspace"}</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Use the sidebar for admin tools. This replaces expandable action panels for long-term scalability.
            </p>
            <p className="mt-1 text-xs text-zinc-500">Signed in as {userId}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Admin Navigation</p>
              <Button type="button" className="w-full" onClick={() => goToState("admin_role_monitor")}>
                Role Monitor
              </Button>
              <Button
                type="button"
                className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                onClick={() => goToState("admin_data_hub")}
              >
                Data Management
              </Button>
              <Button
                type="button"
                className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                onClick={() => goToState("admin_decoder")}
              >
                Lot Code Decoder
              </Button>
              <Button
                type="button"
                className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                onClick={() => {
                  const flagged =
                    data?.lots.find((l) => l.status === "quarantined" || l.integrityStatus === "compromised") ??
                    data?.lots[0];
                  if (flagged) openLotDetail(flagged.id);
                  else goToState("lot_detail");
                }}
              >
                Review Exceptions
              </Button>
            </aside>

            <section className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {kpiCards.map((card) => (
                  <div key={card.label} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <p className="text-xs text-zinc-500">{card.label}</p>
                    <p className="mt-2 text-xl font-semibold text-zinc-900">{String(card.value)}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-zinc-900">{latestRoleActivity.title}</p>
                <div className="mt-2 space-y-1">
                  {latestRoleActivity.lines.length ? (
                    latestRoleActivity.lines.map((line) => (
                      <p key={line} className="text-sm text-zinc-600">
                        {line}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">No recent records yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-zinc-900">{chartSpec?.title ?? "Chart"}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Legend and axis labels describe each live runtime series from lots, events, and trade records.
                </p>
                <div className="mt-3 h-64 sm:h-72">{chartSpec ? <RoleChart chart={chartSpec} /> : null}</div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-zinc-900">{hero?.activityTitle ?? "Recent Activity"}</p>
                <div className="mt-3 space-y-1">
                  {recentActivity.slice(0, 8).map((line) => (
                    <p key={line} className="text-sm text-zinc-600">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      );
    }
    return (
      <div className="mx-auto mt-6 w-full max-w-5xl space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">{hero?.title ?? "Role Workspace"}</h1>
          <p className="mt-1 text-sm text-zinc-600">{hero?.subtitle ?? "Role landing initialized."}</p>
          <p className="mt-1 text-xs text-zinc-500">Signed in as {userId}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-zinc-500">{card.label}</p>
              <p className="mt-2 text-xl font-semibold text-zinc-900">{String(card.value)}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">{latestRoleActivity.title}</p>
          <div className="mt-2 space-y-1">
            {latestRoleActivity.lines.length ? (
              latestRoleActivity.lines.map((line) => (
                <p key={line} className="text-sm text-zinc-600">
                  {line}
                </p>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No recent records yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">{chartSpec?.title ?? "Chart"}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Legend and axis labels describe each live runtime series from lots, events, and trade records.
          </p>
          <div className="mt-3 h-64 sm:h-72">
            {chartSpec ? <RoleChart chart={chartSpec} /> : null}
          </div>
        </div>

        <details className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
            {hero?.activityTitle ?? "Recent Activity"}
          </summary>
          <div className="mt-3 space-y-1">
            {recentActivity.slice(0, 5).map((line) => (
              <p key={line} className="text-sm text-zinc-600">
                {line}
              </p>
            ))}
          </div>
        </details>

        {primaryRole === "farmer" ? (
          <details className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Field &amp; lot actions</summary>
            <div className="mt-3 space-y-2">
              <Button type="button" className="w-full" onClick={() => goToState("farmer_fields")}>
                Manage fields
              </Button>
              <Button
                type="button"
                className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                onClick={() => goToState("farmer_my_lots")}
              >
                My lots
              </Button>
            </div>
          </details>
        ) : null}

        {primaryRole === "aggregator" ? (
          <details className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Intake actions</summary>
            <div className="mt-3 space-y-2">
              <Button type="button" className="w-full" onClick={() => goToState("aggregator_receive")}>
                Receive lot
              </Button>
              <Button
                type="button"
                className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                onClick={() => goToState("aggregator_aggregate")}
              >
                Aggregate lots
              </Button>
            </div>
          </details>
        ) : null}

        {primaryRole === "importer" && permissions.includes("view_lot_lineage") ? (
          <details className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Traceability</summary>
            <div className="mt-3">
              <Button type="button" className="w-full" onClick={() => goToState("importer_lot_trace")}>
                Look up lot by public code
              </Button>
            </div>
          </details>
        ) : null}

        {primaryRole === "exporter" ? (
          <details className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Offer actions</summary>
            <div className="mt-3">
              <Button type="button" className="w-full" onClick={() => goToState("exporter_offer_new")}>
                New offer draft
              </Button>
            </div>
          </details>
        ) : null}

        {primaryRole === "lab_officer" ? (
          <details className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Lab actions</summary>
            <div className="mt-3 space-y-2">
              <Button type="button" className="w-full" onClick={() => goToState("lab_queue")}>
                Open lab intake queue
              </Button>
              <Button
                type="button"
                className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                onClick={() => openLabResultEdit(null)}
              >
                New lab result (select lot)
              </Button>
            </div>
          </details>
        ) : null}

        <div>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              if (primaryRole === "lab_officer") {
                goToState("lab_queue");
              } else if (primaryRole === "importer" || primaryRole === "bank_officer") {
                startTradeFlow();
              } else {
                if (primaryRole === "farmer") {
                  clearSelectedLot();
                  goToState("lot_detail");
                  return;
                }
                if (primaryRole === "exporter") {
                  const readyLot = (data?.lots ?? []).find((l) =>
                    isExportTradeEligibleLot(l, data?.labResults ?? []),
                  );
                  if (readyLot) openLotDetail(readyLot.id);
                  else goToState("lot_detail");
                  return;
                }
                if (primaryRole === "aggregator") {
                  const pending = (data?.lots ?? []).find((lot) => lot.status === "pending_validation");
                  if (pending) openLotDetail(pending.id);
                  else goToState("lot_detail");
                  return;
                }
                if (primaryRole === "processor") {
                  const inStock = (data?.lots ?? []).find((lot) => lot.status === "in_stock");
                  if (inStock) openLotDetail(inStock.id);
                  else goToState("lot_detail");
                  return;
                }
                if (primaryRole === "transporter") {
                  if (!data?.lots || !linkedActorId) {
                    goToState("lot_detail");
                    return;
                  }
                  const m = new Map<string, (typeof data.lots)[0]>();
                  for (const l of data.lots.filter((x) => canTransporterAcceptLot(x, linkedActorId))) m.set(l.id, l);
                  for (const l of data.lots.filter((x) => canTransporterHandoverToLab(x, linkedActorId))) {
                    m.set(l.id, l);
                  }
                  const opts = [...m.values()];
                  if (opts[0]) openLotDetail(opts[0].id);
                  else goToState("lot_detail");
                  return;
                }
                goToState("lot_detail");
              }
            }}
          >
            {primaryRole ? primaryCtaByRole[primaryRole] : "Continue"}
          </Button>
        </div>
      </div>
    );
  }

  if (currentState === "entry") {
    return (
      <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Continue to Sign In</h1>
        <p className="mt-2 text-sm text-zinc-600">This environment requires authentication before access.</p>
        <div className="mt-6">
          <Button type="button" className="w-full" onClick={() => goToState("auth_login")}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  if (currentState === "explore") {
    return (
      <div className="mx-auto mt-6 w-full max-w-2xl space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">
            {selectedListing?.title ?? "Listing Overview"}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {selectedListing?.commodityForm ?? "Commodity details unavailable"}
          </p>
          <p className="mt-1 text-sm text-zinc-600">{selectedListing?.quantity ?? "-"}</p>
          <p className="mt-1 text-sm text-zinc-500">Origin: {selectedListing?.origin ?? "Ethiopia"}</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Listing Insights</h2>
          {authenticated ? (
            <div className="mt-2 space-y-1 text-sm text-zinc-600">
              {(selectedListing?.details ?? []).map((detail) => (
                <p key={detail}>{detail}</p>
              ))}
            </div>
          ) : (
            <div className="mt-2 space-y-1 text-sm text-zinc-500">
              <p>Detailed pricing: hidden until verification</p>
              <p>Counterparty and route specifics: hidden</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Complete basic verification to view more</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Access richer listing context with a quick identity check.
          </p>
          <div className="mt-4">
            <Button
              type="button"
              className="w-full"
              onClick={() => goToState(authenticated ? "dashboard" : "auth_login")}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentState === "rfq_list") {
    return (
      <div className="mx-auto mt-6 w-full max-w-2xl space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">RFQs</h1>
          <p className="mt-1 text-sm text-zinc-600">Importer opens RFQ to begin trade execution.</p>
          {primaryRole === "importer" ? (
            <div className="mt-4">
              <Button type="button" className="w-full" onClick={() => goToState("importer_rfq_new")}>
                New RFQ draft
              </Button>
            </div>
          ) : null}
        </div>
        {(data?.rfqs ?? []).length ? (
          (data?.rfqs ?? []).map((rfq) => (
            <div key={rfq.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-base font-semibold text-zinc-900">{rfq.title}</p>
              <p className="mt-1 text-sm text-zinc-600">{rfq.commodity} / {rfq.form}</p>
              <p className="mt-1 text-sm text-zinc-600">{rfq.targetQuantityKg} kg</p>
              <span className="mt-2 inline-block rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
                {rfq.status}
              </span>
              <div className="mt-4">
                <Button type="button" className="w-full" onClick={() => openRfqDetail(rfq.id)}>
                  Open RFQ
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">No RFQs available.</p>
          </div>
        )}
      </div>
    );
  }

  if (currentState === "rfq_detail") {
    if (!selectedRfq) {
      return (
        <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">RFQ Not Found</h1>
          <p className="mt-2 text-sm text-zinc-600">Selected RFQ record is missing.</p>
          <div className="mt-6">
            <Button type="button" className="w-full" onClick={() => goToState("rfq_list")}>
              Back To RFQ List
            </Button>
          </div>
        </div>
      );
    }
    const nextOffer = (data?.offers ?? []).find((offer) => offer.rfqId === selectedRfq?.id) ?? null;
    return (
      <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">{selectedRfq.title}</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Quantity: {selectedRfq?.targetQuantityKg ?? "-"} kg | Min grade: {selectedRfq?.minimumGrade ?? "-"}
        </p>
        <p className="mt-2 text-sm text-zinc-600">Origin: {(selectedRfq?.originPreference ?? []).join(", ")}</p>
        <span className="mt-3 inline-block rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
          {selectedRfq?.status ?? "open"}
        </span>
        <div className="mt-6 space-y-2">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              if (nextOffer) openOfferDetail(nextOffer.id);
            }}
          >
            {nextOffer ? "Continue To Offer" : "No Offer Linked"}
          </Button>
          {primaryRole === "importer" &&
          selectedRfq.buyerActorId === linkedActorId &&
          selectedRfq.status === "draft" ? (
            <Button type="button" className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100" onClick={() => openRfqEdit(selectedRfq.id)}>
              Edit draft
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (currentState === "offer_detail") {
    if (!selectedOffer) {
      return (
        <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Offer Not Found</h1>
          <p className="mt-2 text-sm text-zinc-600">Selected offer record is missing.</p>
          <div className="mt-6">
            <Button type="button" className="w-full" onClick={() => goToState("rfq_list")}>
              Back To RFQ List
            </Button>
          </div>
        </div>
      );
    }
    const linkedLot =
      selectedOffer.linkedLotIds
        .map((lotId) => (data?.lots ?? []).find((lot) => lot.id === lotId))
        .find((lot): lot is Lot => Boolean(lot)) ?? null;
    return (
      <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Offer {selectedOffer.id}</h1>
        <p className="mt-2 text-sm text-zinc-600">RFQ: {selectedOffer.rfqId}</p>
        <p className="mt-1 text-sm text-zinc-600">
          Quantity: {selectedOffer.offeredQuantityKg} kg at {selectedOffer.pricePerKgUsd} {selectedOffer.currency}
        </p>
        <p className="mt-1 text-sm text-zinc-600">Linked Lot: {linkedLot?.publicLotCode ?? "-"}</p>
        <span className="mt-3 inline-block rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
          {selectedOffer.status}
        </span>
        <div className="mt-6 space-y-2">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              if (linkedLot) openLotDetail(linkedLot.id);
            }}
          >
            {linkedLot ? "Open Linked Lot" : "No Linked Lot"}
          </Button>
          {linkedLot && primaryRole === "importer" && permissions.includes("view_lot_lineage") ? (
            <Button
              type="button"
              className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
              onClick={() => {
                setImporterTraceCode(linkedLot.publicLotCode);
                setImporterTraceStatus("idle");
                setImporterDecodedLotId(null);
                goToState("importer_lot_trace");
              }}
            >
              Trace this lot by code
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (currentState === "lot_detail") {
    if (!data) {
      return <ScreenCard title="Lot Detail" description="Mock data unavailable." />;
    }

    const lot =
      selectedLot ?? (primaryRole === "farmer" ? null : lotDetailDefaultLot) ?? null;

    if (primaryRole === "farmer" && !lot) {
      return (
        <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Create lot</h1>
          <p className="mt-2 text-sm text-zinc-600">Provisional cherry lot from one of your fields.</p>
          <div className="mt-6 space-y-4">
            <select
              value={pickFarmId}
              onChange={(e) => setPickFarmId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
            >
              <option value="">Select field</option>
              {myFarms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                inputMode="decimal"
                value={pickWeightKg}
                onChange={(e) => setPickWeightKg(e.target.value)}
                placeholder="Weight"
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
              />
              <select
                value={pickWeightUnit}
                onChange={(e) => setPickWeightUnit(e.target.value as MassUnit)}
                className="w-24 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm"
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                const result = createMockPickEvent(pickFarmId, toKg(Number(pickWeightKg), pickWeightUnit));
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                setError(null);
                if (result.lotId) openLotDetail(result.lotId);
                else goToState("farmer_my_lots");
              }}
            >
              Create provisional lot
            </Button>
            <Button
              type="button"
              className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
              onClick={() => goToState("dashboard")}
            >
              Back to dashboard
            </Button>
          </div>
        </div>
      );
    }

    if (!lot) {
      return <ScreenCard title="Lot Detail" description="No lot available to render." />;
    }

    if (primaryRole === "farmer" && lot.originActorId !== linkedActorId) {
      return (
        <ScreenCard title="Not your lot" description="You can only open lots you originated." />
      );
    }

    if (selectedOffer) {
      const nextContract = data.contracts.find((contract) => contract.offerId === selectedOffer.id) ?? null;
      return (
        <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Linked Lot Detail</h1>
          <p className="mt-2 text-sm text-zinc-600">Lot: {lot.publicLotCode}</p>
          <p className="mt-1 text-sm text-zinc-600">Form: {lot.form} | Weight: {lot.weightKg} kg</p>
          <span className="mt-3 inline-block rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
            {lot.status}
          </span>
          <div className="mt-6">
            <Button
              type="button"
              className="w-full"
              onClick={() => nextContract && openContractDetail(nextContract.id)}
            >
              Continue To Contract
            </Button>
          </div>
        </div>
      );
    }

    if (primaryRole === "aggregator") {
      const pendingLots = data.lots.filter((item) => item.status === "pending_validation");
      return (
        <div className="mx-auto mt-10 w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Validate Lot</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Confirms farmer-reported pick weight. After validation the lot is in stock and can appear in your receive
            queue while the prior custodian still holds it.
          </p>
          <div className="mt-4 space-y-3">
            {pendingLots.length ? (
              pendingLots.map((pl) => (
                <div
                  key={pl.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3"
                >
                  <div className="text-sm text-zinc-700">
                    <p className="font-mono text-xs text-zinc-900">{pl.publicLotCode}</p>
                    <p>Reported: {pl.weightKg} kg</p>
                  </div>
                  <Button
                    type="button"
                    className="h-9"
                    onClick={() => {
                      setValidateTargetLotId(pl.id);
                      setValidateWeightKg(String(pl.weightKg));
                      setValidateWeightUnit("kg");
                      setError(null);
                    }}
                  >
                    Validate
                  </Button>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                No pending lots. Ask farmer to create new picks first.
              </p>
            )}
          </div>
          {validateTargetLotId ? (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-4">
              <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
                <p className="text-sm font-semibold text-zinc-900">Confirm validated data</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Lot {pendingLots.find((l) => l.id === validateTargetLotId)?.publicLotCode ?? validateTargetLotId}
                </p>
                <div className="mt-4 flex gap-2">
                  <input
                    inputMode="decimal"
                    value={validateWeightKg}
                    onChange={(e) => setValidateWeightKg(e.target.value)}
                    placeholder="Confirmed weight"
                    className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
                  />
                  <select
                    value={validateWeightUnit}
                    onChange={(e) => setValidateWeightUnit(e.target.value as MassUnit)}
                    className="w-24 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm"
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
                {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      const kg = toKg(Number(validateWeightKg), validateWeightUnit);
                      const result = validatePendingLot(validateTargetLotId, kg);
                      if (!result.ok) {
                        setError(result.message);
                        return;
                      }
                      setError(null);
                      setValidateTargetLotId(null);
                    }}
                  >
                    Save validation
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                    onClick={() => setValidateTargetLotId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
          <div className="mt-6">
            <Button type="button" className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100" onClick={() => goToState("dashboard")}>
              Back
            </Button>
          </div>
        </div>
      );
    }

    if (primaryRole === "processor") {
      const processLot =
        processorIntakeLots.find((item) => item.id === processorLotPick) ??
        processorIntakeLots[0] ??
        lot;
      const supportedLossTypes = [
        "pulp",
        "mucilage",
        "moisture_loss",
        "parchment",
        "husk",
        "defects",
        "samples",
        "other",
      ];
      const parsedOutput = toKg(Number(processOutputKg || 0), processOutputUnit);
      const parsedLosses = lossRows
        .map((row) => ({ type: row.type, weightKg: toKg(Number(row.weightKg || 0), processLossUnit) }))
        .filter((row) => row.type.trim() || row.weightKg > 0);
      const totalTypedLoss = parsedLosses.reduce((sum, row) => sum + row.weightKg, 0);
      const massBalancePreview = {
        input: processLot.weightKg,
        output: parsedOutput,
        typedLossTotal: totalTypedLoss,
        variance: processLot.weightKg - parsedOutput - totalTypedLoss,
      };
      return (
        <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Process Lot</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Only lots in your custody and in stock appear here (live chain from aggregator intake).
          </p>
          {processorIntakeLots.length > 1 ? (
            <select
              value={processorLotPick}
              onChange={(e) => setProcessorLotPick(e.target.value)}
              className="mt-4 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
            >
              {processorIntakeLots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.publicLotCode} · {l.weightKg} kg · {l.form}
                </option>
              ))}
            </select>
          ) : null}
          <p className="mt-2 text-sm text-zinc-600">Lot: {processLot.publicLotCode} ({processLot.weightKg} kg input)</p>
          <div className="mt-6 space-y-4">
            <div className="flex gap-2">
              <input
                inputMode="decimal"
                value={processOutputKg}
                onChange={(e) => setProcessOutputKg(e.target.value)}
                placeholder="Output weight"
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
              />
              <select
                value={processOutputUnit}
                onChange={(e) => setProcessOutputUnit(e.target.value as MassUnit)}
                className="w-24 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm"
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>

            <details className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-zinc-900">Typed Loss Rows</summary>
              <div className="mt-3 space-y-3">
                <div className="rounded-lg bg-white p-2 text-xs text-zinc-600">
                  Loss unit
                  <select
                    value={processLossUnit}
                    onChange={(e) => setProcessLossUnit(e.target.value as MassUnit)}
                    className="ml-2 rounded border border-zinc-200 px-2 py-1"
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
                {lossRows.map((row, index) => (
                  <div key={`${index}-${row.type}`} className="rounded-lg bg-white p-3 shadow-sm">
                    <select
                      value={row.type}
                      onChange={(e) => {
                        const next = [...lossRows];
                        next[index] = { ...next[index], type: e.target.value };
                        setLossRows(next);
                      }}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    >
                      <option value="">Select loss type</option>
                      {supportedLossTypes.map((lossType) => (
                        <option key={lossType} value={lossType}>
                          {lossType}
                        </option>
                      ))}
                    </select>
                    <input
                      inputMode="decimal"
                      value={row.weightKg}
                      onChange={(e) => {
                        const next = [...lossRows];
                        next[index] = { ...next[index], weightKg: e.target.value };
                        setLossRows(next);
                      }}
                      placeholder={`Loss weight (${processLossUnit})`}
                      className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                    />
                    {lossRows.length > 1 ? (
                      <button
                        type="button"
                        className="mt-2 text-xs text-zinc-500 hover:text-zinc-800"
                        onClick={() => setLossRows(lossRows.filter((_, i) => i !== index))}
                      >
                        Remove row
                      </button>
                    ) : null}
                  </div>
                ))}
                <button
                  type="button"
                  className="w-full rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
                  onClick={() => setLossRows([...lossRows, { type: "", weightKg: "" }])}
                >
                  Add Loss Row
                </button>
              </div>
            </details>

            <details className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-zinc-900">Process context</summary>
              <div className="mt-3 space-y-2">
                <select
                  value={processType}
                  onChange={(e) =>
                    setProcessType(e.target.value as "PROCESS_PULP_AND_WASH" | "PROCESS_HULL_AND_GRADE")
                  }
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="PROCESS_PULP_AND_WASH">Pulp and wash</option>
                  <option value="PROCESS_HULL_AND_GRADE">Hull and grade</option>
                </select>
                <select
                  value={processFacilityId}
                  onChange={(e) => setProcessFacilityId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Facility (optional)</option>
                  {data.facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <input
                  value={processGrade}
                  onChange={(e) => setProcessGrade(e.target.value)}
                  placeholder="Output grade (optional)"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                />
                <textarea
                  value={processNotes}
                  onChange={(e) => setProcessNotes(e.target.value)}
                  placeholder="Process notes"
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                />
              </div>
            </details>

            <div className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
              <p>Mass Balance Preview</p>
              <p>Input: {massBalancePreview.input} kg</p>
              <p>Output: {massBalancePreview.output} kg</p>
              <p>Total Typed Loss: {massBalancePreview.typedLossTotal} kg</p>
              <p>Variance: {massBalancePreview.variance} kg</p>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                const result = processLotWithLosses(processLot.id, parsedOutput, parsedLosses, {
                  qualityGrade: processGrade.trim() || null,
                  notes: processNotes.trim() || undefined,
                  facilityId: processFacilityId || null,
                  processType,
                });
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                setError(null);
                setLossRows([{ type: "pulp", weightKg: "" }]);
                setProcessOutputKg("");
                setProcessNotes("");
                setProcessGrade("");
                setProcessFacilityId("");
                goToState("dashboard");
              }}
            >
              Confirm Process
            </Button>
          </div>
        </div>
      );
    }

    if (primaryRole === "transporter") {
      const tripLot =
        transporterLotOptions.find((item) => item.id === transporterLotPick) ??
        transporterLotOptions[0] ??
        lot;
      const canPickup = linkedActorId ? canTransporterAcceptLot(tripLot, linkedActorId) : false;
      const canHandover = linkedActorId ? canTransporterHandoverToLab(tripLot, linkedActorId) : false;
      return (
        <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Transport</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Pick up processed lots from the processor (awaiting transport), move in transit, then hand custody to the lab
            before export.
          </p>
          {transporterLotOptions.length > 1 ? (
            <select
              value={transporterLotPick}
              onChange={(e) => setTransporterLotPick(e.target.value)}
              className="mt-4 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
            >
              {transporterLotOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.publicLotCode} · {l.status} · {l.weightKg} kg
                </option>
              ))}
            </select>
          ) : null}
          <p className="mt-2 text-sm text-zinc-600">Selected: {tripLot.publicLotCode}</p>
          <p className="mt-1 text-sm text-zinc-600">Weight: {tripLot.weightKg} kg</p>
          <p className="mt-1 text-xs text-zinc-500">Lab gate: {normalizeLotLabStatus(tripLot)}</p>
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          <div className="mt-6 space-y-2">
            <Button
              type="button"
              className="w-full"
              disabled={!canPickup}
              onClick={() => {
                const result = acceptTransportCustody(tripLot.id);
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                setError(null);
                goToState("dashboard");
              }}
            >
              Accept custody (pickup)
            </Button>
            <Button
              type="button"
              className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
              disabled={!canHandover}
              onClick={() => {
                const result = handoverCustodyToLab(tripLot.id);
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                setError(null);
                goToState("dashboard");
              }}
            >
              Hand over to lab
            </Button>
          </div>
        </div>
      );
    }

    if (primaryRole === "lab_officer") {
      const queueLot =
        selectedLot && labIntakeLots.some((l) => l.id === selectedLot.id)
          ? selectedLot
          : labIntakeLots[0] ?? lot;
      const pendingForLot = data.labResults.find(
        (r) => r.lotId === queueLot.id && r.labActorId === linkedActorId && r.status === "pending",
      );
      return (
        <div className="mx-auto mt-10 w-full max-w-xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Lab intake</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Lots appear after the transporter hands them to the lab. Record a draft result, then approve or fail.
          </p>
          {labIntakeLots.length > 1 ? (
            <select
              value={queueLot.id}
              onChange={(e) => openLotDetail(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
            >
              {labIntakeLots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.publicLotCode} · {l.weightKg} kg
                </option>
              ))}
            </select>
          ) : null}
          <p className="text-sm text-zinc-600">Lot: {queueLot.publicLotCode}</p>
          {pendingForLot ? (
            <p className="text-xs text-amber-700">Draft result {pendingForLot.id} — open edit to finalize.</p>
          ) : (
            <Button type="button" className="w-full" onClick={() => openLabResultEdit(null)}>
              Record lab result for this lot
            </Button>
          )}
          {pendingForLot ? (
            <Button
              type="button"
              className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
              onClick={() => openLabResultEdit(pendingForLot.id)}
            >
              Continue draft result
            </Button>
          ) : null}
          <Button type="button" className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100" onClick={() => goToState("dashboard")}>
            Back to dashboard
          </Button>
        </div>
      );
    }

    if (primaryRole === "exporter") {
      if (!isExportTradeEligibleLot(lot, data.labResults)) {
        return (
          <div className="mx-auto mt-10 w-full max-w-xl space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-zinc-900">Not export-eligible</h1>
            <p className="text-sm text-zinc-600">
              Exporter trade actions require a lab-cleared lot (or legacy approved lab result) in export-ready status.
              Complete transport → lab → approval first.
            </p>
            <p className="text-xs text-zinc-500">Lab gate: {normalizeLotLabStatus(lot)}</p>
            <Button type="button" className="w-full" onClick={() => goToState("dashboard")}>
              Back to dashboard
            </Button>
          </div>
        );
      }
      const linkedOffer = data.offers.find((offer) => offer.linkedLotIds.includes(lot.id)) ?? null;
      const exporterLab = labResultSummaryForLot(lot.id, data.labResults);
      return (
        <div className="mx-auto mt-6 w-full max-w-2xl space-y-4">
          <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Ready Lot Summary</summary>
            <div className="mt-3 space-y-1 text-sm text-zinc-600">
              <p>Public Lot Code: {lot.publicLotCode}</p>
              <p>Status: {lot.status}</p>
              <p>Form: {lot.form}</p>
              <p>Weight: {lot.weightKg} kg</p>
              <p>Lab gate: {normalizeLotLabStatus(lot)}</p>
              {exporterLab ? (
                <p>
                  Lab result: {exporterLab.status} · cup {exporterLab.cupScore} · {exporterLab.gradeConfirmed}
                </p>
              ) : null}
              {lot.exportReservationStatus ? (
                <p>Reservation: {lot.exportReservationStatus}</p>
              ) : null}
            </div>
          </details>
          <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Reservation</summary>
            <div className="mt-3 space-y-2">
              <input
                value={reservationLabel}
                onChange={(e) => setReservationLabel(e.target.value)}
                placeholder="Reservation label (e.g. buyer hold)"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
              />
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  updateLotExportReservation(lot.id, reservationLabel.trim() || null);
                  setReservationLabel("");
                }}
              >
                Update reservation
              </Button>
            </div>
          </details>
          <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Traceability</summary>
            <div className="mt-3">
              <LineageTree lotId={lot.id} lots={data.lots} level={0} />
            </div>
          </details>
          <Button
            type="button"
            className="w-full"
            onClick={() => (linkedOffer ? openOfferDetail(linkedOffer.id) : goToState("dashboard"))}
          >
            {linkedOffer ? "Open Linked Trade Context" : "Back To Dashboard"}
          </Button>
        </div>
      );
    }

    const timelineEvents = data.inventoryEvents
      .filter((event) => event.lotId === lot.id)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const parentLots = lot.parentLotIds
      .map((id) => data.lots.find((candidate) => candidate.id === id))
      .filter((value): value is Lot => Boolean(value));

    const childLots = lot.childLotIds
      .map((id) => data.lots.find((candidate) => candidate.id === id))
      .filter((value): value is Lot => Boolean(value));

    const lineageNodes = buildLineageNodes(lot.id, data.lots);
    const sourceLots = lineageNodes.filter((node) => node.lot.farmId);
    const sourceRows = sourceLots.map((node) => {
      const farm = data.farms.find((item) => item.id === node.lot.farmId);
      const farmer = data.actors.find((item) => item.id === node.lot.originActorId);
      return {
        sourceLotId: node.lot.id,
        farmName: farm?.name ?? null,
        farmerName: farmer?.displayName ?? null,
        region: farm?.region ?? null,
      };
    });

    const owner = data.actors.find((actor) => actor.id === lot.currentOwnerActorId);
    const custodian = data.actors.find((actor) => actor.id === lot.currentCustodianActorId);
    const processingEvents = timelineEvents.filter((event) =>
      event.type.includes("PROCESS") || Array.isArray(event.losses),
    );
    const labForLot = labResultSummaryForLot(lot.id, data.labResults);

    return (
      <div className="mx-auto mt-6 w-full max-w-2xl space-y-4">
        {lot.integrityStatus === "compromised" || lot.status === "quarantined" ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-red-800">Integrity Warning</p>
            <p className="mt-1 text-sm text-red-700">
              This lot is compromised/quarantined and requires controlled handling.
            </p>
          </div>
        ) : null}

        <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Summary</summary>
          <div className="mt-3 space-y-1 text-sm text-zinc-600">
            <p>Lot ID: {lot.id}</p>
            <p>Public Lot Code: {lot.publicLotCode}</p>
            <p>Form: {lot.form}</p>
            <p>Status: {lot.status}</p>
            <p>Weight: {lot.weightKg} kg</p>
            <p>Lab gate: {normalizeLotLabStatus(lot)}</p>
          </div>
        </details>

        <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Lab verification</summary>
          <div className="mt-3 space-y-1 text-sm text-zinc-600">
            {labForLot ? (
              <>
                <p>Sample: {labForLot.sampleCode}</p>
                <p>Status: {labForLot.status}</p>
                <p>
                  Cup score: {labForLot.cupScore} · Grade: {labForLot.gradeConfirmed} · Moisture:{" "}
                  {labForLot.moisturePercent}%
                </p>
              </>
            ) : (
              <p>No lab result linked to this lot id.</p>
            )}
          </div>
        </details>

        <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Ownership</summary>
          <div className="mt-3 text-sm text-zinc-600">
            {owner ? (
              <>
                <p>Owner Actor: {owner.displayName}</p>
                <p>Role: {owner.primaryRole}</p>
              </>
            ) : (
              <p>Owner metadata unavailable.</p>
            )}
          </div>
        </details>

        <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Custody</summary>
          <div className="mt-3 text-sm text-zinc-600">
            {custodian ? (
              <>
                <p>Custodian Actor: {custodian.displayName}</p>
                <p>Role: {custodian.primaryRole}</p>
              </>
            ) : (
              <p>Custody metadata unavailable.</p>
            )}
          </div>
        </details>

        <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Event Timeline</summary>
          <div className="mt-3 space-y-2">
            {timelineEvents.length ? (
              timelineEvents.map((event) => (
                <div key={event.id} className="rounded-xl bg-zinc-50 p-3">
                  <p className="text-sm font-medium text-zinc-900">{event.type}</p>
                  <p className="text-xs text-zinc-500">{event.timestamp}</p>
                  <p className="mt-1 text-sm text-zinc-600">{event.notes}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No timeline events recorded for this lot.</p>
            )}
          </div>
        </details>

        <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Lineage Tree</summary>
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs font-medium text-zinc-500">Parents</p>
              {parentLots.length ? (
                parentLots.map((parent) => (
                  <p key={parent.id} className="text-sm text-zinc-700">
                    {parent.id} - {parent.publicLotCode}
                  </p>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No parent lots.</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Children</p>
              {childLots.length ? (
                childLots.map((child) => (
                  <p key={child.id} className="text-sm text-zinc-700">
                    {child.id} - {child.publicLotCode}
                  </p>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No child lots.</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Recursive Upstream Path</p>
              <LineageTree lotId={lot.id} lots={data.lots} level={0} />
            </div>
          </div>
        </details>

        <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Source Trace</summary>
          <div className="mt-3 space-y-2">
            {sourceRows.length ? (
              sourceRows.map((row) => (
                <div key={row.sourceLotId} className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600">
                  <p>Source Lot: {row.sourceLotId}</p>
                  <p>Farm: {row.farmName ?? "No farm metadata"}</p>
                  <p>Farmer: {row.farmerName ?? "No farmer metadata"}</p>
                  <p>Region: {row.region ?? "No origin region metadata"}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No source trace metadata available for this lot.</p>
            )}
          </div>
        </details>

        <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Processing Details</summary>
          <div className="mt-3 space-y-3">
            {processingEvents.length ? (
              processingEvents.map((event) => (
                <div key={event.id} className="rounded-xl bg-zinc-50 p-3">
                  <p className="text-sm font-medium text-zinc-900">{event.type}</p>
                  <p className="text-xs text-zinc-500">
                    Input: {event.inputWeightKg ?? "-"} kg | Output: {event.outputWeightKg ?? "-"} kg
                  </p>
                  <p className="text-xs text-zinc-500">Variance: {event.varianceKg ?? "-"} kg</p>
                  {event.losses?.length ? (
                    <div className="mt-2 space-y-1">
                      {event.losses.map((loss) => (
                        <p key={`${event.id}-${loss.type}-${loss.weightKg}`} className="text-sm text-zinc-600">
                          {loss.type}: {loss.weightKg} kg
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-zinc-500">No typed losses recorded.</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No processing history available for this lot.</p>
            )}
          </div>
        </details>

        {primaryRole === "farmer" &&
        lot.integrityStatus === "provisional" &&
        lot.originActorId === linkedActorId ? (
          <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Edit provisional lot</summary>
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <input
                  inputMode="decimal"
                  value={farmerEditWeight !== "" ? farmerEditWeight : String(lot.weightKg)}
                  onChange={(e) => setFarmerEditWeight(e.target.value)}
                  placeholder="Weight"
                  className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
                />
                <select
                  value={farmerEditWeightUnit}
                  onChange={(e) => setFarmerEditWeightUnit(e.target.value as MassUnit)}
                  className="w-24 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm"
                >
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
              <textarea
                value={farmerEditNotes !== "" ? farmerEditNotes : (lot.notes ?? "")}
                onChange={(e) => setFarmerEditNotes(e.target.value)}
                placeholder="Notes"
                rows={2}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
              />
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  const w = toKg(Number(farmerEditWeight || lot.weightKg), farmerEditWeightUnit);
                  updateProvisionalLot(lot.id, {
                    weightKg: w,
                    notes: farmerEditNotes || lot.notes,
                  });
                }}
              >
                Save changes
              </Button>
              <Button
                type="button"
                className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                onClick={() => archiveFarmerLot(lot.id)}
              >
                Cancel / archive lot
              </Button>
            </div>
          </details>
        ) : null}

        {primaryRole === "admin" ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-zinc-900">Admin lot controls</p>
            <div className="mt-3 space-y-2">
              <Button type="button" className="w-full" onClick={() => quarantineLot(lot.id, "Admin quarantine")}>
                Quarantine lot
              </Button>
              <Button
                type="button"
                className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
                onClick={() => releaseLotQuarantine(lot.id)}
              >
                Release quarantine
              </Button>
            </div>
          </div>
        ) : null}

        <Button type="button" className="w-full" onClick={() => goToState("dashboard")}>
          Back To Dashboard
        </Button>
      </div>
    );
  }

  if (currentState === "contract_detail") {
    if (selectedContract) {
      const nextBank =
        (data?.bankApprovals ?? []).find((approval) => approval.contractId === selectedContract.id) ?? null;
      return (
        <div className="mx-auto mt-6 w-full max-w-2xl space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-zinc-900">Contract {selectedContract.uid}</h1>
            <span className="mt-2 inline-block rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
              {selectedContract.status}
            </span>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-zinc-900">Execution Timeline</p>
            <div className="mt-3 space-y-3 text-sm text-zinc-600">
              <p>1. RFQ accepted</p>
              <p>2. Offer submitted</p>
              <p>3. Contract created ({selectedContract.uid})</p>
              <p>4. Bank review pending</p>
              <p>5. Lab validation pending</p>
            </div>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={() => nextBank && openBankReview(nextBank.id)}
          >
            Continue To Bank Review
          </Button>
        </div>
      );
    }
    if (selectedOffer) {
      return (
        <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Contract Not Found</h1>
          <p className="mt-2 text-sm text-zinc-600">
            No contract linked to offer {selectedOffer.id}.
          </p>
          <div className="mt-6">
            <Button type="button" className="w-full" onClick={() => goToState("offer_detail")}>
              Back To Offer
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Action Confirmed</h1>
        <p className="mt-2 text-sm text-zinc-600">{lastOperationMessage ?? "Operation completed."}</p>
        {lastMassBalance ? (
          <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700">
            <p>Mass Balance Result</p>
            <p>Input: {lastMassBalance.input} kg</p>
            <p>Output: {lastMassBalance.output} kg</p>
            <p>Typed Loss Total: {lastMassBalance.typedLossTotal} kg</p>
            <p>Variance: {lastMassBalance.variance} kg</p>
          </div>
        ) : null}
        {lastOutputLotId ? (
          <p className="mt-3 text-sm text-zinc-600">
            Output lot created: <span className="font-mono">{lastOutputLotId}</span>
          </p>
        ) : null}
        <div className="mt-6">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              setOperationResult(null, null, null);
              goToState("dashboard");
            }}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }

  if (currentState === "bank_review") {
    if (!selectedBankApproval) {
      return (
        <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Bank Approval Not Found</h1>
          <p className="mt-2 text-sm text-zinc-600">Selected bank approval record is missing.</p>
          <div className="mt-6">
            <Button type="button" className="w-full" onClick={() => goToState("contract_detail")}>
              Back To Contract
            </Button>
          </div>
        </div>
      );
    }
    const nextLab =
      selectedBankApproval && data
        ? data.labResults.find((lab) => lab.contractId === selectedBankApproval.contractId) ?? null
        : null;
    return (
      <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Bank Approval {selectedBankApproval.id}</h1>
        <p className="mt-2 text-sm text-zinc-600">Contract: {selectedBankApproval.contractId}</p>
        <p className="mt-1 text-sm text-zinc-600">
          Guarantee: {selectedBankApproval.guaranteeType} ({selectedBankApproval.guaranteeStatus})
        </p>
        <span className="mt-3 inline-block rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
          {selectedBankApproval.status}
        </span>
        <div className="mt-6 space-y-2">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              if (nextLab) openLabResult(nextLab.id);
            }}
          >
            {nextLab ? "Continue To Lab Result" : "No Lab Result Linked"}
          </Button>
          {primaryRole === "bank_officer" && selectedBankApproval.bankActorId === linkedActorId ? (
            <Button
              type="button"
              className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
              onClick={() => openBankApprovalEdit(selectedBankApproval.id)}
            >
              Edit approval metadata
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (currentState === "lab_result") {
    if (!selectedLabResult) {
      return (
        <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Lab Result Not Found</h1>
          <p className="mt-2 text-sm text-zinc-600">Selected lab result record is missing.</p>
          <div className="mt-6">
            <Button type="button" className="w-full" onClick={() => goToState("bank_review")}>
              Back To Bank Review
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Lab Result {selectedLabResult.id}</h1>
        <p className="mt-2 text-sm text-zinc-600">Sample: {selectedLabResult.sampleCode}</p>
        <p className="mt-1 text-sm text-zinc-600">
          Cup Score: {selectedLabResult.cupScore} | Grade: {selectedLabResult.gradeConfirmed}
        </p>
        <span className="mt-3 inline-block rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
          {selectedLabResult.status}
        </span>
        <div className="mt-6 space-y-2">
          <Button type="button" className="w-full" onClick={() => goToState("trade_ready")}>
            Continue To Readiness
          </Button>
          {primaryRole === "lab_officer" && selectedLabResult.labActorId === linkedActorId ? (
            <Button
              type="button"
              className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100"
              onClick={() => openLabResultEdit(selectedLabResult.id)}
            >
              Edit or finalize result
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (currentState === "trade_ready") {
    return (
      <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Final Contract Readiness</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Commercial sequence complete: RFQ {"->"} Offer {"->"} Contract {"->"} Bank {"->"} Lab.
        </p>
        <span className="mt-3 inline-block rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
          Ready For Execution
        </span>
        <div className="mt-6">
          <Button type="button" className="w-full" onClick={() => goToState("dashboard")}>
            Return To Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (currentState === "importer_lot_trace" && data) {
    if (!permissions.includes("view_lot_lineage")) {
      return (
        <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-red-300 bg-red-50 p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-red-800">Trace lookup restricted</h1>
          <p className="mt-2 text-sm text-red-700">Your role is not authorized for lot lineage lookup.</p>
          <div className="mt-6">
            <Button type="button" className="w-full" onClick={() => goToState("dashboard")}>
              Back to dashboard
            </Button>
          </div>
        </div>
      );
    }

    const importerDecodedLot =
      importerDecodedLotId != null ? (data.lots.find((l) => l.id === importerDecodedLotId) ?? null) : null;
    const importerLineage = importerDecodedLot ? buildLineageNodes(importerDecodedLot.id, data.lots) : [];
    const importerSourceLots = importerLineage.filter((node) => node.lot.farmId);
    const importerCustody =
      importerDecodedLot != null
        ? data.inventoryEvents
            .filter(
              (event) =>
                event.lotId === importerDecodedLot.id && event.fromActorId && event.toActorId,
            )
            .map((event) => {
              const fromN =
                data.actors.find((a) => a.id === event.fromActorId)?.displayName ?? event.fromActorId;
              const toN =
                data.actors.find((a) => a.id === event.toActorId)?.displayName ?? event.toActorId;
              return `${fromN} → ${toN} (${event.type})`;
            })
        : [];
    const importerOwnership =
      importerDecodedLot != null
        ? data.inventoryEvents
            .filter((event) => event.lotId === importerDecodedLot.id && event.type === "TRANSFER_OWNERSHIP")
            .map((event) => {
              const fromN =
                data.actors.find((a) => a.id === event.fromActorId)?.displayName ?? event.fromActorId;
              const toN =
                data.actors.find((a) => a.id === event.toActorId)?.displayName ?? event.toActorId;
              return `${fromN} → ${toN}`;
            })
        : [];
    const tradeLinks =
      importerDecodedLot != null
        ? data.offers.filter((o) => o.linkedLotIds.includes(importerDecodedLot.id))
        : [];
    const importerLabSummary =
      importerDecodedLot != null ? labResultSummaryForLot(importerDecodedLot.id, data.labResults) : null;

    return (
      <div className="mx-auto mt-6 w-full max-w-2xl space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Authorized lot traceability</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Enter the public lot code exactly as printed. Resolution uses the code map and stored records — not pattern
            parsing on the code string.
          </p>
          <div className="mt-4 space-y-3">
            <input
              value={importerTraceCode}
              onChange={(e) => setImporterTraceCode(e.target.value)}
              placeholder="Public lot code"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
            />
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                setImporterTraceStatus("loading");
                setImporterDecodedLotId(null);
                setTimeout(() => {
                  const id = resolveLotIdFromPublicCode(importerTraceCode, data.lotCodeMap, data.lots);
                  if (!id) {
                    setImporterTraceStatus("not_found");
                    setImporterDecodedLotId(null);
                    return;
                  }
                  setImporterDecodedLotId(id);
                  setImporterTraceStatus("success");
                }, 200);
              }}
            >
              Resolve lot
            </Button>
          </div>
        </div>

        {importerTraceStatus === "idle" ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Enter a code linked to an offer or contract you are pursuing.</p>
          </div>
        ) : null}
        {importerTraceStatus === "loading" ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-600">Resolving against live lot code map…</p>
          </div>
        ) : null}
        {importerTraceStatus === "not_found" ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-amber-800">Unknown code</p>
            <p className="mt-1 text-sm text-amber-700">No mapped lot matches this public code in local data.</p>
          </div>
        ) : null}

        {importerTraceStatus === "success" && importerDecodedLot ? (
          <div className="space-y-4">
            <details open className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Lot summary</summary>
              <div className="mt-3 space-y-1 text-sm text-zinc-600">
                <p>Public code: {importerDecodedLot.publicLotCode}</p>
                <p>Status: {importerDecodedLot.status}</p>
                <p>
                  Form: {importerDecodedLot.form} · {importerDecodedLot.weightKg} kg
                </p>
                <p>Commodity: {importerDecodedLot.commodity}</p>
                <p>Lab gate: {normalizeLotLabStatus(importerDecodedLot)}</p>
              </div>
            </details>
            <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Lab result summary</summary>
              <div className="mt-3 space-y-1 text-sm text-zinc-600">
                {importerLabSummary ? (
                  <>
                    <p>Sample: {importerLabSummary.sampleCode}</p>
                    <p>Result status: {importerLabSummary.status}</p>
                    <p>
                      Cup score: {importerLabSummary.cupScore} · Grade: {importerLabSummary.gradeConfirmed} · Moisture:{" "}
                      {importerLabSummary.moisturePercent}%
                    </p>
                  </>
                ) : (
                  <p>No lab result record is linked to this lot in local data.</p>
                )}
              </div>
            </details>
            <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Source farms & farmers</summary>
              <div className="mt-3 space-y-2">
                {importerSourceLots.length ? (
                  importerSourceLots.map((node) => {
                    const farm = data.farms.find((row) => row.id === node.lot.farmId);
                    const farmer = data.actors.find((row) => row.id === node.lot.originActorId);
                    return (
                      <div key={node.lot.id} className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600">
                        <p>Farm: {farm?.name ?? "Unknown"}</p>
                        <p>Farmer: {farmer?.displayName ?? "Unknown"}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-zinc-500">No direct farm pick in lineage (may be aggregated/processed).</p>
                )}
              </div>
            </details>
            <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Lineage</summary>
              <div className="mt-3">
                <LineageTree lotId={importerDecodedLot.id} lots={data.lots} level={0} />
              </div>
            </details>
            <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Custody chain</summary>
              <div className="mt-3 space-y-1 text-sm text-zinc-600">
                {importerCustody.length ? importerCustody.map((line) => <p key={line}>{line}</p>) : (
                  <p>No custody handoffs recorded for this lot id.</p>
                )}
              </div>
            </details>
            <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Ownership chain</summary>
              <div className="mt-3 space-y-1 text-sm text-zinc-600">
                {importerOwnership.length ? importerOwnership.map((line) => <p key={line}>{line}</p>) : (
                  <p>No explicit ownership transfer events.</p>
                )}
              </div>
            </details>
            <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Linked trade objects</summary>
              <div className="mt-3 space-y-1 text-sm text-zinc-600">
                {tradeLinks.length ? (
                  tradeLinks.map((o) => (
                    <p key={o.id}>
                      Offer {o.id} · {o.offeredQuantityKg} kg @ {o.pricePerKgUsd} {o.currency}
                    </p>
                  ))
                ) : (
                  <p>No offers reference this lot in local data.</p>
                )}
              </div>
            </details>
            <Button type="button" className="w-full" onClick={() => openLotDetail(importerDecodedLot.id)}>
              Open full lot record
            </Button>
          </div>
        ) : null}

        <Button type="button" className="w-full border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100" onClick={() => goToState("dashboard")}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  if (currentState === "admin_decoder") {
    if (primaryRole !== "admin") {
      return (
        <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-red-300 bg-red-50 p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-red-800">Decoder Access Restricted</h1>
          <p className="mt-2 text-sm text-red-700">Only admin users can decode public lot codes.</p>
          <div className="mt-6">
            <Button type="button" className="w-full" onClick={() => goToState("dashboard")}>
              Back To Dashboard
            </Button>
          </div>
        </div>
      );
    }

    const decodedLot =
      decodedLotId != null ? (data?.lots.find((lot) => lot.id === decodedLotId) ?? null) : null;
    const decodedLineage = decodedLot && data ? buildLineageNodes(decodedLot.id, data.lots) : [];
    const sourceLots = decodedLineage.filter((node) => node.lot.farmId);
    const custodyChain =
      decodedLot && data
        ? data.inventoryEvents
            .filter((event) => event.lotId === decodedLot.id && event.fromActorId && event.toActorId)
            .map((event) => {
              const fromN =
                data.actors.find((a) => a.id === event.fromActorId)?.displayName ?? event.fromActorId;
              const toN =
                data.actors.find((a) => a.id === event.toActorId)?.displayName ?? event.toActorId;
              return `${fromN} → ${toN}`;
            })
        : [];
    const ownershipChain =
      decodedLot && data
        ? data.inventoryEvents
            .filter((event) => event.lotId === decodedLot.id && event.type === "TRANSFER_OWNERSHIP")
            .map((event) => {
              const fromN =
                data.actors.find((a) => a.id === event.fromActorId)?.displayName ?? event.fromActorId;
              const toN =
                data.actors.find((a) => a.id === event.toActorId)?.displayName ?? event.toActorId;
              return `${fromN} → ${toN}`;
            })
        : [];
    const decodedLabRecords =
      decodedLot && data ? data.labResults.filter((r) => r.lotId === decodedLot.id) : [];
    const decodedLabSummary =
      decodedLot && data ? labResultSummaryForLot(decodedLot.id, data.labResults) : null;

    return (
      <div className="mx-auto mt-6 w-full max-w-2xl space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Lot Code Decoder</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Resolve opaque public lot codes through authorized mapping.
          </p>
          <div className="mt-4 space-y-3">
            <input
              value={decoderCode}
              onChange={(e) => setDecoderCode(e.target.value)}
              placeholder="Enter publicLotCode"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
            />
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                setDecoderStatus("loading");
                setDecodedLotId(null);
                setTimeout(() => {
                  const lotId = resolveLotIdFromPublicCode(
                    decoderCode,
                    data?.lotCodeMap ?? [],
                    data?.lots ?? [],
                  );
                  if (!lotId) {
                    setDecoderStatus("not_found");
                    setDecodedLotId(null);
                    return;
                  }
                  setDecodedLotId(lotId);
                  setDecoderStatus("success");
                }, 250);
              }}
            >
              Decode
            </Button>
          </div>
        </div>

        {decoderStatus === "idle" ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Enter a public lot code to decode its underlying trace record.</p>
          </div>
        ) : null}

        {decoderStatus === "loading" ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-600">Decoding code and resolving linked records...</p>
          </div>
        ) : null}

        {decoderStatus === "not_found" ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-amber-800">No decoder match found</p>
            <p className="mt-1 text-sm text-amber-700">
              The entered public lot code is unknown in the current mapping dataset.
            </p>
          </div>
        ) : null}

        {decoderStatus === "success" && decodedLotId && decodedLot ? (
          <div className="space-y-4">
            <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Decoded Details</summary>
              <div className="mt-3 space-y-1 text-sm text-zinc-600">
                <p>Public code: {decodedLot.publicLotCode}</p>
                <p>internalUuid: {decodedLot.internalUuid}</p>
                <p>traceKey: {decodedLot.traceKey}</p>
                <p>Status: {decodedLot.status}</p>
                <p>Lab gate (normalized): {normalizeLotLabStatus(decodedLot)}</p>
              </div>
            </details>

            <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Lab linkage</summary>
              <div className="mt-3 space-y-2 text-sm text-zinc-600">
                {decodedLabRecords.length ? (
                  decodedLabRecords.map((r) => (
                    <div key={r.id} className="rounded-xl bg-zinc-50 p-3">
                      <p className="font-medium text-zinc-800">Result id: {r.id}</p>
                      <p>Lot id: {r.lotId}</p>
                      <p>Lab actor: {r.labActorId}</p>
                      <p>Sample: {r.sampleCode}</p>
                      <p>Status: {r.status}</p>
                      {r.contractId ? <p>Contract: {r.contractId}</p> : null}
                    </div>
                  ))
                ) : (
                  <p>No lab result rows reference this lot id.</p>
                )}
                {decodedLabSummary ? (
                  <p className="pt-2 text-zinc-700">
                    Summary pick: {decodedLabSummary.status} · cup {decodedLabSummary.cupScore} ·{" "}
                    {decodedLabSummary.gradeConfirmed}
                  </p>
                ) : null}
              </div>
            </details>

            <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Lineage</summary>
              <div className="mt-3">
                <LineageTree lotId={decodedLot.id} lots={data?.lots ?? []} level={0} />
              </div>
            </details>

            <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Source Farms & Farmers</summary>
              <div className="mt-3 space-y-2">
                {sourceLots.map((node) => {
                  const farm = data?.farms.find((row) => row.id === node.lot.farmId);
                  const farmer = data?.actors.find((row) => row.id === node.lot.originActorId);
                  return (
                    <div key={node.lot.id} className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600">
                      <p>Farm: {farm?.name ?? "Unknown"}</p>
                      <p>Farmer: {farmer?.displayName ?? "Unknown"}</p>
                    </div>
                  );
                })}
              </div>
            </details>

            <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Custody Chain</summary>
              <div className="mt-3 space-y-1 text-sm text-zinc-600">
                {custodyChain.length ? custodyChain.map((line) => <p key={line}>{line}</p>) : <p>No custody chain records.</p>}
              </div>
            </details>

            <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Ownership Chain</summary>
              <div className="mt-3 space-y-1 text-sm text-zinc-600">
                {ownershipChain.length ? ownershipChain.map((line) => <p key={line}>{line}</p>) : <p>No ownership transfer records.</p>}
              </div>
            </details>
          </div>
        ) : null}

        <Button type="button" className="w-full" onClick={() => goToState("dashboard")}>
          Back To Dashboard
        </Button>
      </div>
    );
  }

  return <ScreenCard title="Unknown State" description="Unable to render current app state." />;
}

const ROLE_CHART_COLORS = ["#0f766e", "#1d4ed8", "#b45309", "#7c3aed", "#be123c", "#334155"];

function humanizeChartKey(key: string) {
  return key.replace(/_/g, " ");
}

function RoleChart({
  chart,
}: {
  chart: { type: string; title?: string; data: Record<string, string | number>[] };
}) {
  const rows = chart.data ?? [];
  const first = rows[0] ?? {};
  const keys = Object.keys(first);
  const xKey = keys.find((k) => typeof first[k] === "string") ?? keys[0];
  const numericKeys = keys.filter((k) => k !== xKey && typeof first[k] === "number");

  if (!rows.length) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 text-sm text-zinc-500">
        No chart data — create or record activity to populate this view.
      </div>
    );
  }

  if (chart.type === "line") {
    if (numericKeys.length <= 1) {
      const yKey =
        numericKeys[0] ?? keys.find((k) => typeof first[k] === "number") ?? keys[1] ?? keys[0];
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 28, right: 12, left: 8, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 11 }}
              label={{ value: humanizeChartKey(xKey), position: "insideBottom", offset: -14 }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              width={48}
              label={{ value: humanizeChartKey(String(yKey)), angle: -90, position: "insideLeft" }}
            />
            <Tooltip />
            <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: "12px" }} />
            <Line
              type="monotone"
              dataKey={String(yKey)}
              name={humanizeChartKey(String(yKey))}
              stroke={ROLE_CHART_COLORS[0]}
              strokeWidth={2}
              dot
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 28, right: 12, left: 8, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11 }}
            label={{ value: humanizeChartKey(xKey), position: "insideBottom", offset: -14 }}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            width={48}
            label={{ value: "Value", angle: -90, position: "insideLeft" }}
          />
          <Tooltip />
          <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: "12px" }} />
          {numericKeys.map((k, i) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              name={humanizeChartKey(k)}
              stroke={ROLE_CHART_COLORS[i % ROLE_CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "pie") {
    const nameKey = xKey;
    const valueKey = numericKeys[0] ?? "value";
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 8, right: 8, bottom: 36, left: 8 }}>
          <Tooltip />
          <Legend verticalAlign="bottom" height={32} wrapperStyle={{ fontSize: "12px" }} />
          <Pie data={rows} dataKey={valueKey} nameKey={nameKey} outerRadius={88} label>
            {rows.map((_, i) => (
              <Cell key={i} fill={ROLE_CHART_COLORS[i % ROLE_CHART_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "funnel") {
    const valueKey =
      numericKeys[0] ?? keys.find((k) => typeof first[k] === "number") ?? keys[keys.length - 1];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart margin={{ top: 28, right: 24, left: 24, bottom: 8 }}>
          <Tooltip />
          <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: "12px" }} />
          <Funnel
            dataKey={valueKey}
            nameKey={xKey}
            data={rows}
            fill={ROLE_CHART_COLORS[0]}
            isAnimationActive={false}
          >
            {rows.map((_, i) => (
              <Cell key={i} fill={ROLE_CHART_COLORS[i % ROLE_CHART_COLORS.length]} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    );
  }

  const yKey =
    numericKeys[0] ??
    keys.find((key) => key !== xKey && typeof first[key] === "number") ??
    keys[0];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 28, right: 12, left: 8, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11 }}
          label={{ value: humanizeChartKey(xKey), position: "insideBottom", offset: -14 }}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          width={48}
          label={{ value: humanizeChartKey(String(yKey)), angle: -90, position: "insideLeft" }}
        />
        <Tooltip />
        <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: "12px" }} />
        <Bar
          dataKey={String(yKey)}
          name={humanizeChartKey(String(yKey))}
          fill={ROLE_CHART_COLORS[0]}
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
