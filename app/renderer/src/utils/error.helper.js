export function handleApiError(err, defaultMessage, addToast) {
    const message =
        err?.response?.data?.message ||
        err?.message ||
        defaultMessage ||
        "Error inesperado";

    console.error("❌ API Error:", message);

    addToast({
        type: "error",
        title: "Error",
        message,
    });
}
