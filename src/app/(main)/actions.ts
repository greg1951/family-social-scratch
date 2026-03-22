'use server';

import { logout } from "../(family)/(auth-changes)/auth-components/actions";

export async function mainLogout() {
  await logout();
}