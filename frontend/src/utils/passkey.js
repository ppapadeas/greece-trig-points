import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import apiClient from '../api';

export async function registerPasskey(deviceName) {
  const { data: options } = await apiClient.post('/api/passkey/register/options');
  const attestation = await startRegistration({ optionsJSON: options });
  if (deviceName) attestation.deviceName = deviceName;
  const { data } = await apiClient.post('/api/passkey/register/verify', attestation);
  return data;
}

export async function registerPasskeyNewUser(email, displayName) {
  const { data: options } = await apiClient.post('/api/passkey/register/options', { email, displayName });
  const attestation = await startRegistration({ optionsJSON: options });
  const { data } = await apiClient.post('/api/passkey/register/verify', attestation);
  return data;
}

export async function loginWithPasskey() {
  const { data: options } = await apiClient.post('/api/passkey/login/options');
  const assertion = await startAuthentication({ optionsJSON: options });
  const { data } = await apiClient.post('/api/passkey/login/verify', assertion);
  return data;
}

export async function recoverPasskeyOptions(token) {
  const { data } = await apiClient.post('/api/passkey/recover/options', { token });
  return data;
}

export async function recoverPasskeyVerify(attestation) {
  const { data } = await apiClient.post('/api/passkey/recover/verify', attestation);
  return data;
}

export async function runPasskeyRecovery(token, deviceName) {
  const { options, user } = await recoverPasskeyOptions(token);
  const attestation = await startRegistration({ optionsJSON: options });
  if (deviceName) attestation.deviceName = deviceName;
  const result = await recoverPasskeyVerify(attestation);
  return { ...result, requestedFor: user };
}
