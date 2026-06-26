import { Linking, Share } from 'react-native';

export async function abrirPdf(url: string): Promise<void> {
  await Linking.openURL(url);
}

export async function compartirPdf(url: string, titulo: string): Promise<void> {
  await Share.share({ message: `${titulo}\n${url}`, url });
}

export async function enviarWhatsApp(url: string, mensaje: string): Promise<void> {
  const texto = encodeURIComponent(`${mensaje} ${url}`);
  const appUrl = `whatsapp://send?text=${texto}`;
  const puede = await Linking.canOpenURL(appUrl);
  if (puede) {
    await Linking.openURL(appUrl);
    return;
  }
  await Linking.openURL(`https://wa.me/?text=${texto}`);
}
