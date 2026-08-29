import { useState } from "react";

interface SecurityHook {
  validatePickupCode: (inputCode: string, realCode: string) => boolean;
  validateDeliveryCode: (inputCode: string, realCodes: string[] | string, stopIndex: number) => boolean;
  enforcePhotoBeforePin: (photoFile: File | string | null) => boolean;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export default function useFreightSecurity(): SecurityHook {
  const [isProcessing, setIsProcessing] = useState(false);

  // Valida o PIN de Coleta diretamente com o que está salvo no Banco de Dados
  const validatePickupCode = (inputCode: string, realCode: string) => {
    if (!inputCode || !realCode) return false;
    return inputCode.trim() === realCode.trim();
  };

  // Valida o PIN de Entrega sabendo exatamente em qual das 5 paradas o motorista está
  const validateDeliveryCode = (inputCode: string, realCodes: string[] | string, stopIndex: number) => {
    if (!inputCode || !realCodes) return false;

    // Se for apenas uma entrega (string legada), valida direto
    if (typeof realCodes === 'string') {
      return inputCode.trim() === realCodes.trim();
    }

    // Se for múltiplas entregas (Array), valida o PIN da parada atual
    if (Array.isArray(realCodes)) {
      const targetCode = realCodes[stopIndex] || realCodes[realCodes.length - 1];
      return inputCode.trim() === targetCode.trim();
    }

    return false;
  };

  // Trava operacional: O PIN só pode ser processado se a foto existir
  const enforcePhotoBeforePin = (photoFile: File | string | null) => {
    if (!photoFile) return false;
    if (typeof photoFile === 'string' && photoFile.trim() === '') return false;
    return true;
  };

  return {
    validatePickupCode,
    validateDeliveryCode,
    enforcePhotoBeforePin,
    isProcessing,
    setIsProcessing
  };
}
