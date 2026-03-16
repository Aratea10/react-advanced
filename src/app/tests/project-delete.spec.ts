import { expect, test, type Page } from "@playwright/test";

type LoginCandidate = {
    email: string;
    password: string;
};

const loginCandidates: LoginCandidate[] = [
    { email: "sara@google.com", password: "1234" },
];

async function loginToDashboard(page: Page) {
    const user = loginCandidates[0];
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Contraseña").fill(user.password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    try {
        await expect(page).toHaveURL((url) => url.pathname.includes("/dashboard"), {
            timeout: 2000,
        });
        return;
    } catch {
        // Try the next credential candidate.
    }

    throw new Error("No se pudo iniciar sesión con ninguna credencial E2E.");
}

test("login, crear proyecto y borrarlo", async ({ page }) => {
    const projectTitle = `E2E ${Date.now().toString().slice(-6)}`;

    await loginToDashboard(page);

    await page.getByLabel("Nuevo Proyecto").fill(projectTitle);
    await page.getByPlaceholder("Ej. Descripción del proyecto").fill("Proyecto temporal de prueba E2E");
    await page.getByRole("button", { name: "Crear Proyecto" }).click();

    // Esperar confirmación y recargar para ver el proyecto nuevo
    await expect(page.getByText("Proyecto creado exitosamente")).toBeVisible();
    await page.reload();

    // Si hay paginación, ir a la última página
    const nextButton = page.getByRole("button", { name: "Siguiente" });
    while (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(500);
    }

    const createdCard = page.locator("article", { hasText: projectTitle });
    await expect(createdCard).toBeVisible();

    await createdCard.locator("xpath=..").getByRole("button", { name: "Borrar" }).click();
    await expect(page.locator("article", { hasText: projectTitle })).toHaveCount(0);
});
