import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

/** Saves into a folder the user picks (Android Storage Access Framework) - no broad storage permission needed. */
export async function saveTextToFolder(baseName: string, mime: string, content: string): Promise<boolean> {
  const saf = FileSystem.StorageAccessFramework;
  const perm = await saf.requestDirectoryPermissionsAsync();
  if (!perm.granted) return false;
  const uri = await saf.createFileAsync(perm.directoryUri, baseName, mime);
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  return true;
}

export async function shareTextFile(name: string, mime: string, content: string): Promise<void> {
  const uri = `${FileSystem.cacheDirectory}${name}`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('share_unavailable');
  await Sharing.shareAsync(uri, { mimeType: mime });
}

export async function shareFileUri(uri: string, mime: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('share_unavailable');
  await Sharing.shareAsync(uri, { mimeType: mime });
}

export async function pickTextFile(): Promise<string | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  const asset = res.assets?.[0];
  if (res.canceled || !asset) return null;
  return FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
}

/** App-private safety copy written right before a restore. */
export async function writeSafetyCopy(content: string): Promise<string> {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const uri = `${FileSystem.documentDirectory}pre-restore-${stamp}.json`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  return uri;
}

export async function latestSafetyCopy(): Promise<string | null> {
  const names = (await FileSystem.readDirectoryAsync(FileSystem.documentDirectory ?? '')).filter((n) => n.startsWith('pre-restore-')).sort();
  const last = names[names.length - 1];
  return last ? `${FileSystem.documentDirectory}${last}` : null;
}
