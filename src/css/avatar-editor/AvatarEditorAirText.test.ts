import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/css/avatar-editor/AvatarEditorView.css'), 'utf8');
const rule = (selector: string) => css.match(new RegExp(`(?:^|\\}|\\*/)\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]+)\\}`))?.[1] ?? '';

describe('avatar editor effects texts (avatarEditorContent)', () => {
    it('sets the effect name, time left and save hint in 12 px #666666', () => {
        expect(rule('.octane-avatar-editor-effects-params')).toContain('color: #666666');
        expect(rule('.octane-avatar-editor-effects-params')).toContain('font-size: 12px');
        expect(rule('.octane-avatar-editor-effect-time')).toContain('font-size: 12px');
    });
});
