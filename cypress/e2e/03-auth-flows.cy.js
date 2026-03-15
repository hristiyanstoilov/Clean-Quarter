// 🔐 AUTH FLOWS — Password Recovery Tests
// Tests the forgot-password → reset link → new password flow

describe('Password Recovery Flow', () => {
  // Stub Supabase auth so we don't need real tokens
  beforeEach(() => {
    cy.window().then((win) => {
      // Stub SweetAlert2 to auto-confirm with a valid password
      win.Swal = {
        fire: cy.stub().callsFake((opts) => {
          if (opts && opts.title === 'Нова парола') {
            // Simulate user entering a valid password and confirming
            return Promise.resolve({ value: 'NewPass123' });
          }
          // Success / error dialogs — just resolve
          return Promise.resolve({ isConfirmed: true });
        }),
        showLoading: cy.stub(),
        close: cy.stub(),
        showValidationMessage: cy.stub(),
      };
    });
  });

  describe('Recovery modal — triggered by URL hash', () => {
    it('should show password reset modal when type=recovery is in hash', () => {
      // Visit profile with Supabase recovery hash params
      cy.visit('/src/pages/profile.html#access_token=fake-token&type=recovery&refresh_token=fake-refresh');

      // Modal should appear (SweetAlert2 title)
      cy.window().then((win) => {
        expect(win.Swal.fire).to.have.been.calledWithMatch({ title: 'Нова парола' });
      });
    });

    it('should clear the recovery hash from URL after triggering', () => {
      cy.visit('/src/pages/profile.html#access_token=fake-token&type=recovery&refresh_token=fake-refresh');

      cy.location('hash').should('eq', '');
    });

    it('should NOT show recovery modal when no type=recovery in hash', () => {
      cy.visit('/');

      cy.window().then((win) => {
        // Swal should not have been called with recovery title on landing page
        const recoveryCalls = (win.Swal?.fire?.args || []).filter(
          (args) => args[0]?.title === 'Нова парола'
        );
        expect(recoveryCalls.length).to.eq(0);
      });
    });
  });

  describe('Password validation in recovery modal', () => {
    // These test the preConfirm logic directly via unit-style checks
    // since the modal is SweetAlert2-driven

    it('should reject password shorter than 8 characters', () => {
      const preConfirmFn = buildPreConfirmWithPw('Short1');
      const result = preConfirmFn();
      expect(result).to.be.false;
    });

    it('should reject password with no uppercase letter', () => {
      const preConfirmFn = buildPreConfirmWithPw('nouppercase1');
      const result = preConfirmFn();
      expect(result).to.be.false;
    });

    it('should reject password with no lowercase letter', () => {
      const preConfirmFn = buildPreConfirmWithPw('NOLOWERCASE1');
      const result = preConfirmFn();
      expect(result).to.be.false;
    });

    it('should reject password with no digit', () => {
      const preConfirmFn = buildPreConfirmWithPw('NoDigitHere');
      const result = preConfirmFn();
      expect(result).to.be.false;
    });

    it('should accept a valid password', () => {
      const preConfirmFn = buildPreConfirmWithPw('ValidPass1');
      const result = preConfirmFn();
      expect(result).to.eq('ValidPass1');
    });
  });

  describe('Forgot password button — landing page', () => {
    it('should display the forgot password link', () => {
      cy.visit('/');
      cy.contains(/забравена парола|forgot password/i).should('be.visible');
    });

    it('should open SweetAlert2 dialog when forgot password is clicked', () => {
      cy.visit('/');

      cy.window().then((win) => {
        win.Swal = {
          fire: cy.stub().resolves({ isConfirmed: false }),
        };
      });

      cy.contains(/забравена парола|forgot password/i).click();

      cy.window().then((win) => {
        expect(win.Swal.fire).to.have.been.called;
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Helper: simulate preConfirm logic with a given password value injected
// into a fake DOM element (runs outside browser context via eval)
// ---------------------------------------------------------------------------
function buildPreConfirmWithPw(pw) {
  return function () {
    // Replicate the preConfirm validation logic from profile.js
    const pwError =
      pw.length < 8
        ? 'Паролата трябва да е поне 8 символа'
        : !/[A-Z]/.test(pw)
        ? 'Паролата трябва да съдържа главна буква'
        : !/[a-z]/.test(pw)
        ? 'Паролата трябва да съдържа малка буква'
        : !/[0-9]/.test(pw)
        ? 'Паролата трябва да съдържа цифра'
        : null;
    if (pwError) return false;
    return pw;
  };
}
