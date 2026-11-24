import { useCallback } from 'react';

import type * as Types from '@/types';
import { LOCALES } from '@/types/locales';

import { openSystemSetting, openChangeTheme, openAboutUs, openNetworkDiagnosis } from '@/services';

import ContextMenu from '@/utils/context-menu';

interface UseHeaderCtxMenuProps {
  user: Pick<Types.User, 'userId'>;
  onChangeLanguage: (code: Types.Locale) => void;
  onLogout: () => void;
  onExit: () => void;
}

export const useHeaderCtxMenu = ({ user, onChangeLanguage, onLogout, onExit }: UseHeaderCtxMenuProps): Types.ContextMenuBuilder => {
  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addSystemSettingOption(() => openSystemSetting(user.userId))
        .addChangeThemeOption(() => openChangeTheme())
        .addFeedbackOption(() => window.open('https://ricecall.com/feedback', '_blank'))
        .addLanguageSelectOption({ languages: LOCALES }, (code) => (code ? onChangeLanguage(code) : null))
        .addHelpCenterOption(
          {
            onFaqClick: () => window.open('https://ricecall.com/#faq', '_blank'),
            onAgreementClick: () => window.open('https://ricecall.com/terms', '_blank'),
            onSpecificationClick: () => window.open('https://ricecall.com/rules', '_blank'),
            onContactUsClick: () => window.open('https://ricecall.com/contact', '_blank'),
            onAboutUsClick: () => openAboutUs(),
          },
          () => {},
        )
        .addNetworkDiagnosisOption(() => openNetworkDiagnosis())
        .addLogoutOption(onLogout)
        .addExitOption(onExit)
        .build(),
    [user.userId, onChangeLanguage, onLogout, onExit],
  );

  return { buildContextMenu };
};
