"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Funnel,
  FunnelChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";
import type { Lot } from "@/types/mock-data";

function ScreenCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
      <p className="mt-3 text-sm text-zinc-600">{description}</p>
    </div>
  );
}

export function RootScreenController() {
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
  const userId = useAppStore((s) => s.userId);
  const primaryRole = useAppStore((s) => s.primaryRole);
  const goToState = useAppStore((s) => s.goToState);
  const openLotDetail = useAppStore((s) => s.openLotDetail);
  const startTradeFlow = useAppStore((s) => s.startTradeFlow);
  const openRfqDetail = useAppStore((s) => s.openRfqDetail);
  const openOfferDetail = useAppStore((s) => s.openOfferDetail);
  const openContractDetail = useAppStore((s) => s.openContractDetail);
  const openBankReview = useAppStore((s) => s.openBankReview);
  const openLabResult = useAppStore((s) => s.openLabResult);
  const setOperationResult = useAppStore((s) => s.setOperationResult);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [decoderCode, setDecoderCode] = useState("");
  const [decodedLotId, setDecodedLotId] = useState<string | null>(null);
  const [decoderStatus, setDecoderStatus] = useState<
    "idle" | "loading" | "success" | "not_found"
  >("idle");
  const [pickFarmId, setPickFarmId] = useState("");
  const [pickWeightKg, setPickWeightKg] = useState("");
  const [validateWeightKg, setValidateWeightKg] = useState("");
  const [processOutputKg, setProcessOutputKg] = useState("");
  const [lossRows, setLossRows] = useState<Array<{ type: string; weightKg: string }>>([
    { type: "pulp", weightKg: "" },
  ]);

  const pendingUser = useMemo(
    () => (data?.users ?? []).find((u) => u.id === pendingLoginUserId) ?? null,
    [data?.users, pendingLoginUserId],
  );

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

  const dashboardKey = useMemo(() => {
    const map: Record<string, string> = {
      farmer: "farmer_dashboard",
      aggregator: "aggregator_dashboard",
      processor: "processor_dashboard",
      exporter: "exporter_dashboard",
      importer: "importer_dashboard",
      bank_officer: "bank_dashboard",
      admin: "admin_dashboard",
      transporter: "transporter_dashboard",
      lab_officer: "lab_dashboard",
    };
    return primaryRole ? map[primaryRole] : "";
  }, [primaryRole]);

  const primaryCtaByRole: Record<string, string> = {
    farmer: "Record Pick",
    aggregator: "Validate Lot",
    processor: "Process Lot",
    exporter: "Review Ready Lot",
    importer: "Review RFQ",
    bank_officer: "Review Approval",
    transporter: "Accept Custody",
    lab_officer: "Record Result",
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
      subtitle: "Review sample outcomes and quality verification records.",
      activityTitle: "Recent Lab Results",
    },
    admin: {
      title: "Admin Workspace",
      subtitle: "Oversee exceptions, integrity events, and decoder tools.",
      activityTitle: "Recent System Exceptions",
    },
  };

  const dashboardEntry = useMemo(() => {
    if (!data || !dashboardKey) return null;
    return data.dashboardMetrics[dashboardKey] ?? null;
  }, [data, dashboardKey]);

  const recentActivity = useMemo(() => {
    if (!data || !primaryRole) return [];
    const actorId = data.users.find((user) => user.id === userId)?.linkedActorId;
    if (!actorId) return [];
    if (primaryRole === "farmer") {
      return data.lots
        .filter((lot) => lot.originActorId === actorId)
        .map((lot) => `Lot ${lot.publicLotCode} (${lot.status})`);
    }
    if (primaryRole === "aggregator" || primaryRole === "processor" || primaryRole === "transporter") {
      return data.inventoryEvents
        .filter((event) => event.actorId === actorId)
        .map((event) => `${event.type} - ${event.lotId}`);
    }
    if (primaryRole === "exporter") {
      return data.offers.filter((offer) => offer.sellerActorId === actorId).map((offer) => `Offer ${offer.id}`);
    }
    if (primaryRole === "importer") {
      return data.rfqs.filter((rfq) => rfq.buyerActorId === actorId).map((rfq) => `RFQ ${rfq.uid}`);
    }
    if (primaryRole === "bank_officer") {
      return data.bankApprovals
        .filter((approval) => approval.bankActorId === actorId)
        .map((approval) => `Approval ${approval.id} (${approval.status})`);
    }
    if (primaryRole === "lab_officer") {
      return data.labResults
        .filter((result) => result.labActorId === actorId)
        .map((result) => `Lab ${result.sampleCode} (${result.status})`);
    }
    if (primaryRole === "admin") {
      return data.lots
        .filter((lot) => lot.integrityStatus === "compromised")
        .map((lot) => `Exception: ${lot.publicLotCode} quarantined`);
    }
    return [];
  }, [data, primaryRole, userId]);

  const chartSpec = useMemo(() => {
    if (!data || !primaryRole) return null;
    if (dashboardEntry?.charts?.[0]) return dashboardEntry.charts[0];

    if (primaryRole === "transporter") {
      const actorId = data.users.find((user) => user.id === userId)?.linkedActorId;
      const transfers = data.inventoryEvents.filter(
        (event) => event.actorId === actorId && event.type.includes("TRANSFER"),
      );
      return {
        type: "bar",
        title: "Transport Events",
        data: [{ name: "Transfers", count: transfers.length }],
      };
    }
    if (primaryRole === "lab_officer") {
      const actorId = data.users.find((user) => user.id === userId)?.linkedActorId;
      const rows = data.labResults
        .filter((result) => result.labActorId === actorId)
        .map((result) => ({ sample: result.sampleCode, cupScore: result.cupScore }));
      return { type: "line", title: "Cup Score Trend", data: rows.length ? rows : [{ sample: "N/A", cupScore: 0 }] };
    }
    return { type: "bar", title: "No Data", data: [{ name: "items", value: 0 }] };
  }, [dashboardEntry, data, primaryRole, userId]);

  const summaryCards = useMemo(() => {
    if (dashboardEntry?.summaryCards?.length) return dashboardEntry.summaryCards.slice(0, 4);
    if (!data || !primaryRole) return [];
    const fallback = [
      { label: "My Lots", value: data.lots.length },
      { label: "Events", value: data.inventoryEvents.length },
      { label: "Records", value: recentActivity.length },
      { label: "Role", value: primaryRole },
    ];
    return fallback.slice(0, 4);
  }, [dashboardEntry, data, primaryRole, recentActivity.length]);

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

  if (currentState === "dashboard") {
    const hero = primaryRole ? roleHero[primaryRole] : null;
    return (
      <div className="mx-auto mt-6 w-full max-w-2xl space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">{hero?.title ?? "Role Workspace"}</h1>
          <p className="mt-1 text-sm text-zinc-600">{hero?.subtitle ?? "Role landing initialized."}</p>
          <p className="mt-1 text-xs text-zinc-500">Signed in as {userId}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-zinc-500">{card.label}</p>
              <p className="mt-1 text-base font-semibold text-zinc-900">{String(card.value)}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-zinc-900">{chartSpec?.title ?? "Chart"}</p>
          <div className="mt-3 h-56">
            {chartSpec ? <RoleChart chart={chartSpec} /> : null}
          </div>
        </div>

        {primaryRole === "admin" ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-zinc-900">Lot Code Decoder</p>
            <p className="mt-1 text-sm text-zinc-600">Admin-only decoding of opaque public lot codes.</p>
          </div>
        ) : null}

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

        <div>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              if (primaryRole === "admin") {
                goToState("admin_decoder");
              } else if (
                primaryRole === "importer" ||
                primaryRole === "bank_officer" ||
                primaryRole === "lab_officer"
              ) {
                startTradeFlow();
              } else {
                if (primaryRole === "exporter") {
                  const readyLot =
                    (data?.lots ?? []).find((lot) => lot.status === "ready_for_export") ??
                    (data?.lots ?? []).find((lot) => lot.status === "contract_reserved");
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
                  const tripLot = (data?.lots ?? []).find((lot) => lot.status === "in_stock");
                  if (tripLot) openLotDetail(tripLot.id);
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
        <div className="mt-6">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              if (nextOffer) openOfferDetail(nextOffer.id);
            }}
          >
            {nextOffer ? "Continue To Offer" : "No Offer Linked"}
          </Button>
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
        <div className="mt-6">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              if (linkedLot) openLotDetail(linkedLot.id);
            }}
          >
            {linkedLot ? "Open Linked Lot" : "No Linked Lot"}
          </Button>
        </div>
      </div>
    );
  }

  if (currentState === "lot_detail") {
    if (!data) {
      return <ScreenCard title="Lot Detail" description="Mock data unavailable." />;
    }

    const lot = selectedLot ?? data.lots[0] ?? null;
    if (!lot) {
      return <ScreenCard title="Lot Detail" description="No lot available to render." />;
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

    if (primaryRole === "farmer") {
      return (
        <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Record Pick</h1>
          <p className="mt-2 text-sm text-zinc-600">Create a provisional pick event for a farm lot.</p>
          <div className="mt-6 space-y-4">
            <select
              value={pickFarmId}
              onChange={(e) => setPickFarmId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
            >
              <option value="">Select farm</option>
              {data.farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
            <input
              inputMode="decimal"
              value={pickWeightKg}
              onChange={(e) => setPickWeightKg(e.target.value)}
              placeholder="Weight (kg)"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                const result = createMockPickEvent(pickFarmId, Number(pickWeightKg));
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                setError(null);
                goToState("contract_detail");
              }}
            >
              Create Provisional Event
            </Button>
          </div>
        </div>
      );
    }

    if (primaryRole === "aggregator") {
      const pendingLot = lot.status === "pending_validation"
        ? lot
        : data.lots.find((item) => item.status === "pending_validation") ?? lot;
      return (
        <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Validate Lot</h1>
          <p className="mt-2 text-sm text-zinc-600">Lot: {pendingLot.publicLotCode}</p>
          <p className="mt-1 text-sm text-zinc-600">Reported Weight: {pendingLot.weightKg} kg</p>
          <div className="mt-6 space-y-4">
            <input
              inputMode="decimal"
              value={validateWeightKg}
              onChange={(e) => setValidateWeightKg(e.target.value)}
              placeholder="Confirmed weight (kg)"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                const result = validatePendingLot(pendingLot.id, Number(validateWeightKg));
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                setError(null);
                goToState("contract_detail");
              }}
            >
              Mark Validated
            </Button>
          </div>
        </div>
      );
    }

    if (primaryRole === "processor") {
      const processLot = lot.status === "in_stock" ? lot : data.lots.find((item) => item.status === "in_stock") ?? lot;
      const supportedLossTypes = [
        "pulp",
        "mucilage",
        "moisture_loss",
        "parchment",
        "husk",
        "defects",
        "samples",
      ];
      const parsedOutput = Number(processOutputKg || 0);
      const parsedLosses = lossRows
        .map((row) => ({ type: row.type, weightKg: Number(row.weightKg || 0) }))
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
          <p className="mt-2 text-sm text-zinc-600">Lot: {processLot.publicLotCode} ({processLot.weightKg} kg input)</p>
          <div className="mt-6 space-y-4">
            <input
              inputMode="decimal"
              value={processOutputKg}
              onChange={(e) => setProcessOutputKg(e.target.value)}
              placeholder="Output weight (kg)"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm"
            />

            <details className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-zinc-900">Typed Loss Rows</summary>
              <div className="mt-3 space-y-3">
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
                      placeholder="Loss weight (kg)"
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
                const result = processLotWithLosses(processLot.id, Number(processOutputKg), parsedLosses);
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                setError(null);
                setLossRows([{ type: "pulp", weightKg: "" }]);
                setProcessOutputKg("");
                goToState("contract_detail");
              }}
            >
              Confirm Process
            </Button>
          </div>
        </div>
      );
    }

    if (primaryRole === "transporter") {
      const tripLot = lot.status === "in_stock" ? lot : data.lots.find((item) => item.status === "in_stock") ?? lot;
      return (
        <div className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">Accept Custody</h1>
          <p className="mt-2 text-sm text-zinc-600">Trip Lot: {tripLot.publicLotCode}</p>
          <p className="mt-1 text-sm text-zinc-600">Weight: {tripLot.weightKg} kg</p>
          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          <div className="mt-6">
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                const result = acceptTransportCustody(tripLot.id);
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                setError(null);
                goToState("contract_detail");
              }}
            >
              Confirm Custody
            </Button>
          </div>
        </div>
      );
    }

    if (primaryRole === "exporter") {
      const linkedOffer = data.offers.find((offer) => offer.linkedLotIds.includes(lot.id)) ?? null;
      return (
        <div className="mx-auto mt-6 w-full max-w-2xl space-y-4">
          <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Ready Lot Summary</summary>
            <div className="mt-3 space-y-1 text-sm text-zinc-600">
              <p>Public Lot Code: {lot.publicLotCode}</p>
              <p>Status: {lot.status}</p>
              <p>Form: {lot.form}</p>
              <p>Weight: {lot.weightKg} kg</p>
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
        <div className="mt-6">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              setOperationResult(null, null);
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
        <div className="mt-6">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              if (nextLab) openLabResult(nextLab.id);
            }}
          >
            {nextLab ? "Continue To Lab Result" : "No Lab Result Linked"}
          </Button>
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
        <div className="mt-6">
          <Button type="button" className="w-full" onClick={() => goToState("trade_ready")}>
            Continue To Readiness
          </Button>
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

    const decodedMap = (data?.lotCodeMap ?? []).find((row) => row.publicLotCode === decoderCode.trim());
    const decodedLot = decodedMap ? data?.lots.find((lot) => lot.id === decodedMap.lotId) ?? null : null;
    const decodedLineage = decodedLot && data ? buildLineageNodes(decodedLot.id, data.lots) : [];
    const sourceLots = decodedLineage.filter((node) => node.lot.farmId);
    const custodyChain =
      decodedLot && data
        ? data.inventoryEvents
            .filter((event) => event.lotId === decodedLot.id && event.fromActorId && event.toActorId)
            .map((event) => `${event.fromActorId} -> ${event.toActorId}`)
        : [];
    const ownershipChain =
      decodedLot && data
        ? data.inventoryEvents
            .filter((event) => event.lotId === decodedLot.id && event.type === "TRANSFER_OWNERSHIP")
            .map((event) => `${event.fromActorId} -> ${event.toActorId}`)
        : [];

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
                  const map = (data?.lotCodeMap ?? []).find(
                    (row) => row.publicLotCode === decoderCode.trim(),
                  );
                  if (!map) {
                    setDecoderStatus("not_found");
                    setDecodedLotId(null);
                    return;
                  }
                  setDecodedLotId(map.lotId);
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
                <p>internalUuid: {decodedLot.internalUuid}</p>
                <p>traceKey: {decodedLot.traceKey}</p>
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

function LineageTree({ lotId, lots, level }: { lotId: string; lots: Lot[]; level: number }) {
  const lot = lots.find((item) => item.id === lotId);
  if (!lot) return null;

  return (
    <div className={`${level > 0 ? "ml-4 border-l border-zinc-200 pl-3" : ""} space-y-2`}>
      <div className="rounded-xl bg-zinc-50 p-3">
        <p className="text-sm font-medium text-zinc-900">{lot.id}</p>
        <p className="text-xs text-zinc-500">{lot.publicLotCode}</p>
      </div>
      {lot.parentLotIds.map((parentId) => (
        <LineageTree key={`${lot.id}-${parentId}`} lotId={parentId} lots={lots} level={level + 1} />
      ))}
    </div>
  );
}

function buildLineageNodes(
  rootLotId: string,
  lots: Lot[],
  visited: Set<string> = new Set(),
): { lot: Lot }[] {
  const lot = lots.find((item) => item.id === rootLotId);
  if (!lot || visited.has(rootLotId)) return [];
  visited.add(rootLotId);

  const children = lot.parentLotIds.flatMap((parentId) => buildLineageNodes(parentId, lots, visited));
  return [{ lot }, ...children];
}

function RoleChart({
  chart,
}: {
  chart: { type: string; data: Record<string, string | number>[] };
}) {
  const rows = chart.data ?? [];
  const first = rows[0] ?? {};
  const keys = Object.keys(first);
  const xKey = keys.find((key) => typeof first[key] === "string") ?? keys[0];
  const yKey =
    keys.find((key) => key !== xKey && typeof first[key] === "number") ??
    keys.find((key) => typeof first[key] === "number") ??
    keys[0];

  if (chart.type === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={yKey} stroke="#334155" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "pie") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip />
          <Pie data={rows} dataKey={yKey} nameKey={xKey} outerRadius={80} fill="#475569" />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chart.type === "funnel") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip />
          <Funnel data={rows} dataKey={yKey} nameKey={xKey} fill="#64748b" />
        </FunnelChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Bar dataKey={yKey} fill="#475569" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
