import { PrismaClient, Language, CmsSectionType } from '@prisma/client';

const prisma = new PrismaClient();

export const getCmsSections = async (languageCode: Language) => {
  return await prisma.cmsSection.findMany({
    where: {
      languageCode,
      isActive: true,
    },
    orderBy: {
      position: 'asc',
    },
  });
};

export const updateCmsSection = async (
  id: string,
  data: {
    title?: string;
    content?: string;
    position?: number;
    isActive?: boolean;
  }
) => {
  return await prisma.cmsSection.update({
    where: { id },
    data,
  });
};

export const createCmsSection = async (data: {
  title: string;
  key: string;
  content: string;
  position: number;
  languageCode: Language;
  type: CmsSectionType;
}) => {
  return await prisma.cmsSection.create({
    data,
  });
};

export const getTranslation = async (key: string, languageCode: Language) => {
  const translation = await prisma.translation.findUnique({
    where: {
      key_languageCode: {
        key,
        languageCode,
      },
    },
  });
  return translation?.value;
};

export const setTranslation = async (
  key: string,
  languageCode: Language,
  value: string
) => {
  return await prisma.translation.upsert({
    where: {
      key_languageCode: {
        key,
        languageCode,
      },
    },
    update: { value },
    create: {
      key,
      languageCode,
      value,
    },
  });
};

export const getTranslationsForKey = async (key: string) => {
  return await prisma.translation.findMany({
    where: { key },
  });
};

// Cache für Übersetzungen
const translationCache = new Map<string, { value: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

export const getCachedTranslation = async (
  key: string,
  languageCode: Language
) => {
  const cacheKey = `${key}_${languageCode}`;
  const cached = translationCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.value;
  }

  const value = await getTranslation(key, languageCode);
  
  if (value) {
    translationCache.set(cacheKey, {
      value,
      timestamp: Date.now(),
    });
  }

  return value;
};

export const clearTranslationCache = () => {
  translationCache.clear();
}; 