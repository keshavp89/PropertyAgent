import assert from "node:assert/strict";
import test from "node:test";
import { canEditProperty, canViewCustomer, isManager, normalizeRole } from "./access.ts";

test("unknown roles are treated as members", () => {
  assert.equal(normalizeRole("owner"), "owner");
  assert.equal(normalizeRole("admin"), "admin");
  assert.equal(normalizeRole("member"), "member");
  assert.equal(normalizeRole("superadmin"), "member");
});

test("managers can edit any listing and see every customer in the brokerage", () => {
  assert.equal(isManager("owner"), true);
  assert.equal(isManager("admin"), true);
  assert.equal(isManager("member"), false);
  assert.equal(canEditProperty("admin", "user-a", "user-b"), true);
  assert.equal(canViewCustomer("owner", "user-a", "user-b"), true);
});

test("members can edit only their listings and see only their customers", () => {
  assert.equal(canEditProperty("member", "user-a", "user-a"), true);
  assert.equal(canEditProperty("member", "user-a", "user-b"), false);
  assert.equal(canViewCustomer("member", "user-a", "user-a"), true);
  assert.equal(canViewCustomer("member", "user-a", "user-b"), false);
});
