import { sampleCustomers, type Customer } from "@/lib/board";

const customerStorageKey = "kinship-customer-pipeline";

export function getLocalCustomers() {
  if (typeof window === "undefined") {
    return sampleCustomers;
  }

  const raw = window.localStorage.getItem(customerStorageKey);

  if (!raw) {
    setLocalCustomers(sampleCustomers);
    return sampleCustomers;
  }

  try {
    return JSON.parse(raw) as Customer[];
  } catch {
    setLocalCustomers(sampleCustomers);
    return sampleCustomers;
  }
}

export function setLocalCustomers(customers: Customer[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(customerStorageKey, JSON.stringify(customers));
}
