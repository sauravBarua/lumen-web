import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessageText } from './message-text';

describe('MessageText', () => {
  it('highlights mentions and keeps the surrounding text', () => {
    const { container } = render(<MessageText content="hi @bob and @maya!" meUsername="maya" />);
    expect(container).toHaveTextContent('hi @bob and @maya!');
    expect(container.querySelectorAll('[data-mention]')).toHaveLength(2);
  });

  it('ignores emails and handles that are too short', () => {
    const { container } = render(
      <MessageText content="mail bob@example.com or @ab" meUsername="maya" />,
    );
    expect(container.querySelectorAll('[data-mention]')).toHaveLength(0);
  });

  it('never renders markup', () => {
    render(<MessageText content="<img src=x onerror=alert(1)>" meUsername="maya" />);
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });
});
