import * as FileSystem from 'expo-file-system';

import { DOMParser } from '@xmldom/xmldom';
import JSZip from 'jszip';

export type EpubMetadata = {
  title: string | null;
  author: string | null;
  cover: string | null;
};

export const getEpubMetadataFromFile = async (uri: string): Promise<EpubMetadata> => {
  let metadata: EpubMetadata = {
    title: null,
    author: null,
    cover: null,
  };

  const file = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  const zip = await JSZip.loadAsync(file, { base64: true });
  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  if (!containerXml) {
    console.error('META-INF/container.xml not found');
    return metadata;
  }
  const containerDoc = new DOMParser().parseFromString(containerXml, 'application/xml');
  const rootfilePath = containerDoc.getElementsByTagName('rootfile')[0].getAttribute('full-path');
  const opfXml = await zip.file(rootfilePath!)?.async('string');
  if (!opfXml) {
    console.error('OPF file not found');
    return metadata;
  }
  const opfDoc = new DOMParser().parseFromString(opfXml, 'application/xml');

  metadata.title = opfDoc.getElementsByTagName('dc:title')[0].textContent || '';
  metadata.author = opfDoc.getElementsByTagName('dc:creator')[0].textContent || '';

  const metaElements = opfDoc.getElementsByTagName('meta');
  let coverId: string | null = null;
  for (let i = 0; i < metaElements.length; i++) {
    const meta = metaElements[i];
    if (meta.getAttribute('name') === 'cover') {
      coverId = meta.getAttribute('content');
      break;
    }
  }
  if (!coverId) {
    console.log('Cover ID not found');
    return metadata;
  }

  const itemElements = opfDoc.getElementsByTagName('item');
  let coverHref: string | null = null;
  let mediaType: string | null = null;
  for (let i = 0; i < itemElements.length; i++) {
    const item = itemElements[i];
    if (item.getAttribute('id') === coverId) {
      coverHref = item.getAttribute('href');
      mediaType = item.getAttribute('media-type');
      break;
    }
  }
  if (!coverHref || !mediaType) {
    console.log('Cover image href or media type not found');
    return metadata;
  }

  const opfBasePath = rootfilePath!.substring(0, rootfilePath!.lastIndexOf('/') + 1);
  const coverPath = opfBasePath + coverHref;
  const imageBlob = await zip.file(coverPath)?.async('base64');
  if (!imageBlob) {
    console.log('Cover image not found in zip');
    return metadata;
  }
  metadata.cover = `data:${mediaType};base64,${imageBlob}`;
  return metadata;
};
