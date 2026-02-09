import Toast from 'react-native-toast-message';

interface ApiErrorOptions {
  fallbackTitle?: string;
  fallbackMessage?: string;
  showToast?: boolean;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === 'NO_INTERNET') return 'No internet connection';
  }
  const axiosError = error as { response?: { data?: { detail?: unknown } } };
  if (axiosError.response?.data?.detail) {
    const detail = axiosError.response.data.detail;
    return typeof detail === 'string' ? detail : JSON.stringify(detail);
  }
  return 'An unexpected error occurred';
}

export function handleApiError(error: unknown, options: ApiErrorOptions = {}) {
  if (error instanceof Error && error.name === 'AbortError') return '';
  if (error instanceof Error && error.name === 'CanceledError') return '';

  const message = getApiErrorMessage(error);
  const { fallbackTitle = 'Error', showToast = true } = options;
  console.error(fallbackTitle, error);
  if (showToast) {
    Toast.show({
      type: 'error',
      text1: fallbackTitle,
      text2: options.fallbackMessage ?? message,
    });
  }
  return message;
}
