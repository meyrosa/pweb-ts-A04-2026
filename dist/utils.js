export const $ = (id) => {
    const el = document.getElementById(id);
    if (!el)
        throw new Error(`Elemen #${id} tidak ditemukan`);
    return el;
};
export function escapeHtml(s) {
    const map = {
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    };
    return s.replace(/[&<>"']/g, (c) => map[c]);
}
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const formatTime = (d = new Date()) => d.toLocaleTimeString("id-ID", { hour12: false });
