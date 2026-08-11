/**
 * Déclenche le téléchargement d'un blob (ex: PDF récupéré via une requête authentifiée).
 * Un <a download> synthétique est utilisé plutôt qu'un aperçu (window.open) : les URL blob:
 * ne survivent pas à une navigation asynchrone entre fenêtres/onglets et les navigateurs
 * bloquent la navigation de premier niveau vers une URL data:, donc le téléchargement est le
 * seul mécanisme fiable pour un blob récupéré de façon asynchrone.
 */
export function telechargerBlob(blob: Blob, nomFichier: string): void {
  const url = URL.createObjectURL(blob);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
