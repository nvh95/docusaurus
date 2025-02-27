/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import _ from 'lodash';
import type {
  TranslationFileContent,
  TranslationFile,
  I18n,
} from '@docusaurus/types';
import {DEFAULT_PLUGIN_ID, I18N_DIR_NAME} from './constants';
import {normalizeUrl} from './urlUtils';

/**
 * Takes a list of translation file contents, and shallow-merges them into one.
 */
export function mergeTranslations(
  contents: TranslationFileContent[],
): TranslationFileContent {
  return contents.reduce((acc, content) => ({...acc, ...content}), {});
}

/**
 * Useful to update all the messages of a translation file. Used in tests to
 * simulate translations.
 */
export function updateTranslationFileMessages(
  translationFile: TranslationFile,
  updateMessage: (message: string) => string,
): TranslationFile {
  return {
    ...translationFile,
    content: _.mapValues(translationFile.content, (translation) => ({
      ...translation,
      message: updateMessage(translation.message),
    })),
  };
}

/**
 * Takes everything needed and constructs a plugin i18n path. Plugins should
 * expect everything it needs for translations to be found under this path.
 */
export function getPluginI18nPath({
  siteDir,
  locale,
  pluginName,
  pluginId = DEFAULT_PLUGIN_ID,
  subPaths = [],
}: {
  siteDir: string;
  locale: string;
  pluginName: string;
  pluginId?: string | undefined;
  subPaths?: string[];
}): string {
  return path.join(
    siteDir,
    I18N_DIR_NAME,
    // Namespace first by locale: convenient to work in a single folder for a
    // translator
    locale,
    // Make it convenient to use for single-instance
    // ie: return "docs", not "docs-default" nor "docs/default"
    `${pluginName}${pluginId === DEFAULT_PLUGIN_ID ? '' : `-${pluginId}`}`,
    ...subPaths,
  );
}

/**
 * Takes a path and returns a localized a version (which is basically `path +
 * i18n.currentLocale`).
 */
export function localizePath({
  pathType,
  path: originalPath,
  i18n,
  options = {},
}: {
  /**
   * FS paths will treat Windows specially; URL paths will always have a
   * trailing slash to make it a valid base URL.
   */
  pathType: 'fs' | 'url';
  /** The path, URL or file path, to be localized. */
  path: string;
  /** The current i18n context. */
  i18n: I18n;
  options?: {
    /**
     * By default, we don't localize the path of defaultLocale. This option
     * would override that behavior. Setting `false` is useful for `yarn build
     * -l zh-Hans` to always emit into the root build directory.
     */
    localizePath?: boolean;
  };
}): string {
  const shouldLocalizePath: boolean =
    //
    options.localizePath ?? i18n.currentLocale !== i18n.defaultLocale;

  if (!shouldLocalizePath) {
    return originalPath;
  }
  // FS paths need special care, for Windows support
  if (pathType === 'fs') {
    return path.join(originalPath, i18n.currentLocale);
  }
  // Url paths; add a trailing slash so it's a valid base URL
  return normalizeUrl([originalPath, i18n.currentLocale, '/']);
}
