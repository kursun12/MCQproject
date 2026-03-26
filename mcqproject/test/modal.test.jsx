import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Modal from '../src/components/Modal.jsx';

describe('Modal', () => {
  it('moves focus into the dialog and closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <div>
        <button type="button">Open</button>
        <Modal open onClose={onClose} title="Example modal">
          <input type="text" aria-label="Modal field" />
        </Modal>
      </div>,
    );

    await waitFor(() => expect(screen.getByLabelText('Modal field')).toHaveFocus());
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
