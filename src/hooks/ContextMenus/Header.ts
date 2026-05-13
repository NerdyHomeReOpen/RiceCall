import { useCallback } from 'react';

import type * as Types from '@/types';

import { openSystemSetting, openChangeTheme, openAboutUs, openNetworkDiagnosis } from '@/services';

import ContextMenu from '@/utils/contextMenu';

import { LANGUAGES } from '@/constants';

interface UseHeaderContextMenuProps {
  user: Pick<Types.User, 'userId'>;
  onChangeLanguage: (code: Types.LanguageKey) => void;
  onLogout: () => void;
  onExit: () => void;
}

export const useHeaderContextMenu = ({ user, onChangeLanguage, onLogout, onExit }: UseHeaderContextMenuProps) => {
  const buildContextMenu = useCallback(
    () =>
      new ContextMenu()
        .addSystemSettingOption(() => openSystemSetting(user.userId))
        .addChangeThemeOption(() => openChangeTheme())
        .addFeedbackOption(() => window.open('https://ricecall.com/feedback', '_blank'))
        .addLanguageSelectOption({ languages: LANGUAGES }, (code) => (code ? onChangeLanguage(code) : null))
        .addHelpCenterOption(
          {
            onFaqClick: () => window.open('https://ricecall.com/#faq', '_blank'),
            onAgreementClick: () => window.open('https://ricecall.com/terms', '_blank'),
            onSpecificationClick: () => window.open('https://ricecall.com/specification', '_blank'),
            onContactUsClick: () => window.open('https://ricecall.com/contact', '_blank'),
            onAboutUsClick: () => openAboutUs(),
          },
          () => { },
        )
        .addNetworkDiagnosisOption(() => openNetworkDiagnosis())
        .addLogoutOption(onLogout)
        .addExitOption(onExit)
        .build(),
    [user.userId, onChangeLanguage, onLogout, onExit],
  );

  return { buildContextMenu };
};
