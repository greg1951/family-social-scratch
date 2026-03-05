'use server';

import { logout } from "../(auth)/(logged-in)/auth-components/actions";

export async function mainLogout() {
  await logout();
}