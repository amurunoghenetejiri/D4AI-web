/**
 * D4AI device control — Android WebView bridge (window.D4Device)
 * and graceful no-ops on pure web.
 */

export type DeviceStatus = {
  volume?: number;
  volumeMax?: number;
  volumePct?: number;
  brightness?: number;
  brightnessPct?: number;
  canWriteSettings?: boolean;
  torch?: boolean;
  error?: string;
};

type NativeBridge = {
  ping?: () => string;
  getStatus?: () => string;
  setVolume?: (pct: number) => string;
  adjustVolume?: (delta: number) => string;
  setBrightness?: (pct: number) => string;
  openApp?: (name: string) => string;
  openSettings?: (panel: string) => string;
  setTorch?: (on: boolean) => string;
  vibrate?: (ms: number) => string;
  listApps?: (limit: number) => string;
};

function bridge(): NativeBridge | null {
  try {
    const w = window as unknown as { D4Device?: NativeBridge };
    return w.D4Device || null;
  } catch {
    return null;
  }
}

function parseJson<T>(raw: string | undefined | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function isDeviceBridgeAvailable(): boolean {
  const b = bridge();
  try {
    return Boolean(b && b.ping && b.ping() === "ok");
  } catch {
    return false;
  }
}

export function getDeviceStatus(): DeviceStatus {
  const b = bridge();
  if (!b?.getStatus) return {};
  return parseJson<DeviceStatus>(b.getStatus(), {});
}

export function setVolumePercent(pct: number): { ok: boolean; volumePct?: number; error?: string } {
  const b = bridge();
  if (!b?.setVolume) return { ok: false, error: "Device control only works in the D4AI Android app." };
  return parseJson(b.setVolume(Math.round(pct)), { ok: false });
}

export function adjustVolume(delta: number): { ok: boolean; volumePct?: number; error?: string } {
  const b = bridge();
  if (!b?.adjustVolume) return { ok: false, error: "Device control only works in the D4AI Android app." };
  return parseJson(b.adjustVolume(delta), { ok: false });
}

export function setBrightnessPercent(pct: number): { ok: boolean; brightnessPct?: number; error?: string; needsPermission?: boolean } {
  const b = bridge();
  if (!b?.setBrightness) return { ok: false, error: "Device control only works in the D4AI Android app." };
  return parseJson(b.setBrightness(Math.round(pct)), { ok: false });
}

export function openApp(name: string): { ok: boolean; error?: string; package?: string } {
  const b = bridge();
  if (!b?.openApp) return { ok: false, error: "Opening apps only works in the D4AI Android app." };
  return parseJson(b.openApp(name), { ok: false });
}

export function openSettingsPanel(panel: string): { ok: boolean; error?: string } {
  const b = bridge();
  if (!b?.openSettings) return { ok: false, error: "Settings only open from the D4AI Android app." };
  return parseJson(b.openSettings(panel), { ok: false });
}

export function setTorch(on: boolean): { ok: boolean; error?: string } {
  const b = bridge();
  if (!b?.setTorch) return { ok: false, error: "Flashlight only works in the D4AI Android app." };
  return parseJson(b.setTorch(on), { ok: false });
}

export function vibrate(ms = 200): { ok: boolean } {
  const b = bridge();
  if (!b?.vibrate) return { ok: false };
  return parseJson(b.vibrate(ms), { ok: false });
}

export type DeviceCommand =
  | { type: "volume_set"; pct: number }
  | { type: "volume_up" }
  | { type: "volume_down" }
  | { type: "brightness_set"; pct: number }
  | { type: "open_app"; name: string }
  | { type: "settings"; panel: string }
  | { type: "torch"; on: boolean }
  | { type: "vibrate" }
  | { type: "status" };

/** Parse natural-language phone control commands. */
export function parseDeviceCommand(text: string): DeviceCommand | null {
  const t = String(text || "").trim().toLowerCase();
  if (!t) return null;

  if (/\b(status|what.?s my volume|how bright)\b/.test(t) && /\b(volume|bright|battery|device)\b/.test(t)) {
    return { type: "status" };
  }
  if (/\b(volume|sound)\b/.test(t) && /\b(up|increase|louder|raise)\b/.test(t)) return { type: "volume_up" };
  if (/\b(volume|sound)\b/.test(t) && /\b(down|decrease|lower|quieter)\b/.test(t)) return { type: "volume_down" };
  const volSet = t.match(/\b(?:set\s+)?volume\s+(?:to\s+)?(\d{1,3})\s*%?/);
  if (volSet) return { type: "volume_set", pct: Math.min(100, parseInt(volSet[1], 10)) };
  if (/\b(mute|silence)\b/.test(t) && /\b(volume|sound|phone)\b/.test(t)) return { type: "volume_set", pct: 0 };

  const br = t.match(/\b(?:set\s+)?brightness\s+(?:to\s+)?(\d{1,3})\s*%?/);
  if (br) return { type: "brightness_set", pct: Math.min(100, parseInt(br[1], 10)) };
  if (/\b(brightness|screen)\b/.test(t) && /\b(max|full|brightest)\b/.test(t)) return { type: "brightness_set", pct: 100 };
  if (/\b(brightness|screen)\b/.test(t) && /\b(dim|low|dark)\b/.test(t)) return { type: "brightness_set", pct: 20 };

  if (/\b(torch|flashlight|flash light)\b/.test(t)) {
    if (/\b(off|disable|close)\b/.test(t)) return { type: "torch", on: false };
    return { type: "torch", on: true };
  }
  if (/\bvibrate\b/.test(t)) return { type: "vibrate" };

  const openAppM = t.match(/\b(?:open|launch|start)\s+(?:the\s+)?([a-z0-9_.\-\s]{2,40})/);
  if (openAppM) {
    const name = openAppM[1].replace(/\s+(app|please|for me)$/i, "").trim();
    if (name && !/settings|wifi|data|hotspot|bluetooth/.test(name)) {
      return { type: "open_app", name };
    }
  }

  if (/\b(wifi|wi-fi)\b/.test(t) && /\b(open|settings|turn|enable|disable|on|off)\b/.test(t)) {
    return { type: "settings", panel: "wifi" };
  }
  if (/\b(mobile data|cellular|data)\b/.test(t) && /\b(open|settings|turn|on|off)\b/.test(t)) {
    return { type: "settings", panel: "data" };
  }
  if (/\b(hotspot|tether)\b/.test(t)) return { type: "settings", panel: "hotspot" };
  if (/\bbluetooth\b/.test(t) && /\b(open|settings|turn|on|off)\b/.test(t)) {
    return { type: "settings", panel: "bluetooth" };
  }
  if (/\b(airplane|flight)\s*mode\b/.test(t)) return { type: "settings", panel: "airplane" };
  if (/\bopen\s+settings\b/.test(t)) return { type: "settings", panel: "settings" };

  return null;
}

export async function runDeviceCommand(cmd: DeviceCommand): Promise<string> {
  switch (cmd.type) {
    case "volume_set": {
      const r = setVolumePercent(cmd.pct);
      return r.ok ? `Volume set to ${r.volumePct ?? cmd.pct}%.` : r.error || "Could not change volume.";
    }
    case "volume_up": {
      const r = adjustVolume(2);
      return r.ok ? `Volume up — now about ${r.volumePct ?? "?"}% .` : r.error || "Could not change volume.";
    }
    case "volume_down": {
      const r = adjustVolume(-2);
      return r.ok ? `Volume down — now about ${r.volumePct ?? "?"}% .` : r.error || "Could not change volume.";
    }
    case "brightness_set": {
      const r = setBrightnessPercent(cmd.pct);
      if (!r.ok) return r.error || "Could not change brightness.";
      if (r.needsPermission) return `Brightness set to ${cmd.pct}% for this app. Allow Modify system settings for D4AI if you want system-wide brightness.`;
      return `Brightness set to ${cmd.pct}%.`;
    }
    case "open_app": {
      const r = openApp(cmd.name);
      return r.ok ? `Opening ${cmd.name}.` : r.error || `Could not open ${cmd.name}.`;
    }
    case "settings": {
      const r = openSettingsPanel(cmd.panel);
      return r.ok
        ? `Opened ${cmd.panel} settings. Toggle what you need there — Android limits apps from changing Wi-Fi/data/hotspot silently.`
        : r.error || "Could not open settings.";
    }
    case "torch": {
      const r = setTorch(cmd.on);
      return r.ok ? (cmd.on ? "Flashlight on." : "Flashlight off.") : r.error || "Could not control flashlight.";
    }
    case "vibrate": {
      vibrate(250);
      return "Done — vibrated.";
    }
    case "status": {
      const s = getDeviceStatus();
      if (s.error) return s.error;
      return `Device: volume ~${s.volumePct ?? "?"}% , brightness ~${s.brightnessPct ?? "?"}%${s.torch ? ", torch on" : ""}.`;
    }
    default:
      return "Unknown command.";
  }
}
