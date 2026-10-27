import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TypingIndicator } from './typing-indicator';

describe('TypingIndicator', () => {
  it('renders nothing visible when nobody types', () => {
    const { container } = render(<TypingIndicator names={[]} />);
    expect(container).toHaveTextContent('');
  });

  it('names one, two or several people', () => {
    const { rerender } = render(<TypingIndicator names={['alice']} />);
    expect(screen.getByText('alice is typing…')).toBeInTheDocument();
    rerender(<TypingIndicator names={['alice', 'bob']} />);
    expect(screen.getByText('alice and bob are typing…')).toBeInTheDocument();
    rerender(<TypingIndicator names={['a', 'b', 'c']} />);
    expect(screen.getByText('Several people are typing…')).toBeInTheDocument();
  });
});
