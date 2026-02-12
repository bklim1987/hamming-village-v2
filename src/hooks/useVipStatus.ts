import { useState, useEffect, useCallback } from 'react';

interface VipStatus {
  isVip: boolean;
  addVipToUrl: (url: string) => string;
  updateVipStatus: (vip: boolean) => void;
}

export function useVipStatus(): VipStatus {
  const [isVip, setIsVip] = useState<boolean>(false);

  useEffect(() => {
    try {
      // 先检查 localStorage
      const vipStatus = localStorage.getItem('hamming_vip');
      if (vipStatus === 'true') {
        setIsVip(true);
        return;
      }

      // 然后检查 URL 参数
      const searchParams = new URLSearchParams(window.location.search);
      const vipParam = searchParams.get('vip');
      if (vipParam === 'true') {
        setIsVip(true);
        localStorage.setItem('hamming_vip', 'true');
      }
    } catch (error) {
      console.error('Error parsing VIP status from URL:', error);
      setIsVip(false);
    }
  }, []);

  const addVipToUrl = useCallback((url: string): string => {
    if (!isVip) return url;

    try {
      const urlObj = new URL(url, window.location.origin);
      urlObj.searchParams.set('vip', 'true');
      return urlObj.pathname + urlObj.search + urlObj.hash;
    } catch (error) {
      console.error('Error adding VIP to URL:', error);
      return url;
    }
  }, [isVip]);

  const updateVipStatus = useCallback((vip: boolean) => {
    try {
      const url = new URL(window.location.href);
      if (vip) {
        url.searchParams.set('vip', 'true');
        localStorage.setItem('hamming_vip', 'true');
      } else {
        url.searchParams.delete('vip');
        localStorage.removeItem('hamming_vip');
      }
      window.history.replaceState({}, '', url.toString());
      setIsVip(vip);
    } catch (error) {
      console.error('Error updating VIP status:', error);
    }
  }, []);

  return { isVip, addVipToUrl, updateVipStatus };
}
