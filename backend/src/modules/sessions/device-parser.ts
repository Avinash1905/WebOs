/**
 * WebOS Backend - Robust Device & User-Agent Parser
 * Zero-dependency extraction of browser, operating system, device type, and architecture.
 */

import type { DeviceInfo, DeviceType } from './session.types.js';

export class DeviceParser {
  public static parse(userAgent: string | undefined | null): DeviceInfo {
    if (!userAgent || typeof userAgent !== 'string') {
      return {
        deviceType: 'unknown',
        browser: 'Unknown',
        browserVersion: null,
        os: 'Unknown',
        osVersion: null,
        cpuArchitecture: null
      };
    }

    const ua = userAgent.trim();

    // 1. Device Type Heuristics
    let deviceType: DeviceType = 'desktop';
    if (/bot|crawler|spider|curl|wget|postman/i.test(ua)) {
      deviceType = 'bot';
    } else if (/iPad|tablet|(android(?!.*mobile))/i.test(ua)) {
      deviceType = 'tablet';
    } else if (/Mobile|iPhone|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      deviceType = 'mobile';
    }

    // 2. OS Detection
    let os = 'Unknown';
    let osVersion: string | null = null;

    if (/Windows NT 10.0/i.test(ua)) {
      os = 'Windows';
      osVersion = '10/11';
    } else if (/Windows NT 6.3/i.test(ua)) {
      os = 'Windows';
      osVersion = '8.1';
    } else if (/Windows NT 6.2/i.test(ua)) {
      os = 'Windows';
      osVersion = '8';
    } else if (/Windows NT 6.1/i.test(ua)) {
      os = 'Windows';
      osVersion = '7';
    } else if (/Windows/i.test(ua)) {
      os = 'Windows';
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      os = 'iOS';
      if (/OS (\d+[._]\d+)/i.test(ua)) {
        osVersion = RegExp.$1.replace(/_/g, '.');
      }
    } else if (/Mac OS X|Macintosh/i.test(ua)) {
      os = 'macOS';
      if (/Mac OS X (\d+[._]\d+[._]?\d*)/i.test(ua)) {
        osVersion = RegExp.$1.replace(/_/g, '.');
      }
    } else if (/Android/i.test(ua)) {
      os = 'Android';
      if (/Android (\d+[._]\d+)/i.test(ua)) {
        osVersion = RegExp.$1;
      }
    } else if (/CrOS/i.test(ua)) {
      os = 'ChromeOS';
      } else if (/Linux/i.test(ua)) {
        os = 'Linux';
      }

    // 3. Browser Detection (order matters due to browser engine spoofing)
    let browser = 'Unknown';
    let browserVersion: string | null = null;

    if (/Edg\/(\d+[.0-9]*)/i.test(ua)) {
      browser = 'Microsoft Edge';
      browserVersion = RegExp.$1;
    } else if (/OPR\/(\d+[.0-9]*)|Opera\/(\d+[.0-9]*)/i.test(ua)) {
      browser = 'Opera';
      browserVersion = RegExp.$1 || RegExp.$2;
    } else if (/Chrome\/(\d+[.0-9]*)/i.test(ua)) {
      browser = 'Chrome';
      browserVersion = RegExp.$1;
    } else if (/Firefox\/(\d+[.0-9]*)/i.test(ua)) {
      browser = 'Firefox';
      browserVersion = RegExp.$1;
    } else if (/Version\/(\d+[.0-9]*).*Safari/i.test(ua)) {
      browser = 'Safari';
      browserVersion = RegExp.$1;
    } else if (/curl\/(\d+[.0-9]*)/i.test(ua)) {
      browser = 'curl';
      browserVersion = RegExp.$1;
    }

    // 4. CPU Architecture
    let cpuArchitecture: string | null = null;
    if (/x86_64|x64|Win64|WOW64|amd64/i.test(ua)) {
      cpuArchitecture = 'x86_64';
    } else if (/arm64|aarch64/i.test(ua)) {
      cpuArchitecture = 'arm64';
    } else if (/armv7l|arm/i.test(ua)) {
      cpuArchitecture = 'arm';
    } else if (/i686|i386|x86/i.test(ua)) {
      cpuArchitecture = 'x86';
    }

    return {
      deviceType,
      browser,
      browserVersion,
      os,
      osVersion,
      cpuArchitecture
    };
  }
}
