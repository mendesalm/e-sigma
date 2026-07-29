import { test, expect } from '@playwright/test';

test.describe('Página de Login (E2E)', () => {
  test('deve renderizar a tela de login e apresentar botão Entrar', async ({ page }) => {
    // Acessa a rota de login
    await page.goto('/login');

    // Valida se a página carregou a string Acesso Restrito
    await expect(page.locator('text=Acesso Restrito')).toBeVisible();

    // Valida se existem os campos de e-mail e senha (por Role ou Placeholder)
    const emailInput = page.getByLabel(/CIM ou E-mail/i);
    await expect(emailInput).toBeVisible();

    const passwordInput = page.getByLabel(/Senha/i);
    await expect(passwordInput).toBeVisible();

    // Valida se o botão de entrar está presente
    const loginButton = page.getByRole('button', { name: /Entrar/i });
    await expect(loginButton).toBeVisible();
  });
});
