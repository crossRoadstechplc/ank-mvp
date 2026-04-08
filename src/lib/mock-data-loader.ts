import { z } from "zod";

import appJson from "@/mock-data/app.json";
import rolesJson from "@/mock-data/roles.json";
import organizationsJson from "@/mock-data/organizations.json";
import usersJson from "@/mock-data/users.json";
import actorsJson from "@/mock-data/actors.json";
import farmsJson from "@/mock-data/farms.json";
import facilitiesJson from "@/mock-data/facilities.json";
import vehiclesJson from "@/mock-data/vehicles.json";
import lotsJson from "@/mock-data/lots.json";
import inventoryEventsJson from "@/mock-data/inventoryEvents.json";
import rfqsJson from "@/mock-data/rfqs.json";
import offersJson from "@/mock-data/offers.json";
import auctionsJson from "@/mock-data/auctions.json";
import contractsJson from "@/mock-data/contracts.json";
import bankApprovalsJson from "@/mock-data/bankApprovals.json";
import labResultsJson from "@/mock-data/labResults.json";
import dashboardMetricsJson from "@/mock-data/dashboardMetrics.json";
import lotCodeMapJson from "@/mock-data/lotCodeMap.json";
import type {
  ActorsFile,
  AuctionsFile,
  BankApprovalsFile,
  ContractsFile,
  DashboardMetricsFile,
  FacilitiesFile,
  FarmsFile,
  InventoryEventsFile,
  LabResultsFile,
  LotCodeMapFile,
  LotsFile,
  MockDataBundle,
  OffersFile,
  OrganizationsFile,
  RfqsFile,
  RolesFile,
  UsersFile,
  VehiclesFile,
} from "@/types/mock-data";

const appSchema = z.object({
  app: z.object({
    name: z.string(),
    version: z.string(),
    commodity: z.string(),
    environment: z.string(),
  }),
});

const nonEmptyArray = z.array(z.unknown()).min(1);

export function loadMockData(): MockDataBundle {
  const parsedApp = appSchema.parse(appJson);
  const roles = (rolesJson as RolesFile).roles;
  const organizations = (organizationsJson as OrganizationsFile).organizations;
  const users = (usersJson as UsersFile).users;
  const actors = (actorsJson as ActorsFile).actors;
  const farms = (farmsJson as FarmsFile).farms;
  const facilities = (facilitiesJson as FacilitiesFile).facilities;
  const vehicleData = vehiclesJson as VehiclesFile;
  const lots = (lotsJson as LotsFile).lots;
  const inventoryEvents = (inventoryEventsJson as InventoryEventsFile).inventoryEvents;
  const rfqs = (rfqsJson as RfqsFile).rfqs;
  const offers = (offersJson as OffersFile).offers;
  const auctions = (auctionsJson as AuctionsFile).auctions;
  const contracts = (contractsJson as ContractsFile).contracts;
  const bankApprovals = (bankApprovalsJson as BankApprovalsFile).bankApprovals;
  const labResults = (labResultsJson as LabResultsFile).labResults;
  const dashboardMetrics = (dashboardMetricsJson as DashboardMetricsFile).dashboardMetrics;
  const lotCodeMap = (lotCodeMapJson as LotCodeMapFile).lotCodeMap;

  // Lightweight sanity checks so malformed mocks fail fast.
  nonEmptyArray.parse(roles);
  nonEmptyArray.parse(users);
  nonEmptyArray.parse(lots);

  return {
    app: parsedApp.app,
    roles,
    organizations,
    users,
    actors,
    farms,
    facilities,
    vehicles: vehicleData.vehicles,
    drivers: vehicleData.drivers,
    lots,
    inventoryEvents,
    rfqs,
    offers,
    auctions,
    contracts,
    bankApprovals,
    labResults,
    dashboardMetrics,
    lotCodeMap,
  };
}
