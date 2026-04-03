const { SUPPORTED_LOCALES } = require('../../config/constants');
const { normalizeLocale } = require('../../app/validators');

module.exports = {
  meta: {
    name: 'language',
    aliases: ['lang', 'locale'],
    category: 'utility',
    permissions: ['ManageGuild'],
    botPermissions: [],
    cooldown: 2,
    args: { min: 0, max: 1, usage: 'language [vi|en]' },
    examples: ['language vi', 'language en'],
    descriptionKey: 'commands.language.description',
    guildOnly: true
  },
  async execute({ args, locale, message, guildSettingsRepo, respond, t, colors }) {
    const requestedLocale = args[0];

    if (!requestedLocale) {
      await respond({
        color: colors.PRIMARY,
        titleKey: 'commands.language.currentTitle',
        descriptionKey: 'commands.language.currentDescription',
        descriptionParams: {
          locale
        }
      });
      return;
    }

    const normalized = normalizeLocale(requestedLocale);

    if (!normalized) {
      await respond({
        color: colors.WARNING,
        description: t('common.errors.invalidLocale', {
          locales: SUPPORTED_LOCALES.join(', ')
        })
      });
      return;
    }

    await guildSettingsRepo.setLocale(message.guild.id, normalized);

    await respond({
      color: colors.SUCCESS,
      titleKey: 'commands.language.updatedTitle',
      descriptionKey: 'commands.language.updatedDescription',
      descriptionParams: {
        locale: normalized
      }
    });
  }
};
