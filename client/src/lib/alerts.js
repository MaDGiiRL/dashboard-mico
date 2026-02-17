// src/lib/alerts.js
import Swal from "sweetalert2";

export function toastOk(title = "Salvato") {
    return Swal.fire({
        icon: "success",
        title,
        toast: true,
        position: "top-end",
        timer: 1600,
        showConfirmButton: false,
    });
}

export function toastErr(err, title = "Errore") {
    const msg =
        err?.data?.error ||
        err?.message ||
        "Errore sconosciuto";

    return Swal.fire({
        icon: "error",
        title,
        text: msg,
        confirmButtonText: "Ok",
    });
}

export async function confirmDanger(text = "Sei sicuro?") {
    const res = await Swal.fire({
        icon: "warning",
        title: "Conferma",
        text,
        showCancelButton: true,
        confirmButtonText: "Sì, elimina",
        cancelButtonText: "Annulla",
        confirmButtonColor: "#e11d48",
    });
    return res.isConfirmed;
}
