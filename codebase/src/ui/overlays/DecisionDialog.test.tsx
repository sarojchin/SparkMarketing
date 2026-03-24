import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DecisionDialog } from './DecisionDialog';
import type { Decision } from '@/engine/types';

describe('DecisionDialog', () => {
  const mockDecision: Decision = {
    id: 'test-decision-1',
    type: 'contract_offer',
    title: 'Test Decision',
    description: 'This is a test decision',
    options: [
      {
        id: 'option-1',
        label: 'Accept',
        description: 'Accept the offer',
        consequences: 'Gain revenue',
      },
      {
        id: 'option-2',
        label: 'Decline',
        description: 'Decline the offer',
        consequences: 'Stay safe',
      },
    ],
  };

  it('should render the decision dialog with title and description', () => {
    const mockOnChoose = vi.fn();

    render(
      <DecisionDialog decision={mockDecision} onChoose={mockOnChoose} />
    );

    expect(screen.getByText('Test Decision')).toBeInTheDocument();
    expect(screen.getByText('This is a test decision')).toBeInTheDocument();
  });

  it('should render all options', () => {
    const mockOnChoose = vi.fn();

    const { container } = render(
      <DecisionDialog decision={mockDecision} onChoose={mockOnChoose} />
    );

    expect(container.textContent).toContain('Accept');
    expect(container.textContent).toContain('Decline');
    expect(container.textContent).toContain('Accept the offer');
    expect(container.textContent).toContain('Decline the offer');
  });

  it('should render option consequences', () => {
    const mockOnChoose = vi.fn();

    render(
      <DecisionDialog decision={mockDecision} onChoose={mockOnChoose} />
    );

    expect(screen.getByText('Gain revenue')).toBeInTheDocument();
    expect(screen.getByText('Stay safe')).toBeInTheDocument();
  });

  it('should call onChoose with correct arguments when an option is clicked', () => {
    const mockOnChoose = vi.fn();

    const { container } = render(
      <DecisionDialog decision={mockDecision} onChoose={mockOnChoose} />
    );

    // Find the button containing "Accept" text
    const buttons = container.querySelectorAll('button[type="button"]');
    let acceptButton: Element | null = null;
    buttons.forEach((btn) => {
      if (btn.textContent?.includes('Accept') && !btn.textContent?.includes('Decline')) {
        acceptButton = btn;
      }
    });

    expect(acceptButton).toBeInTheDocument();
    fireEvent.click(acceptButton!);

    expect(mockOnChoose).toHaveBeenCalledWith('test-decision-1', 'option-1');
  });

  it('should call onChoose for different options', () => {
    const mockOnChoose = vi.fn();

    const { container } = render(
      <DecisionDialog decision={mockDecision} onChoose={mockOnChoose} />
    );

    // Find the button containing "Decline" text
    const buttons = container.querySelectorAll('button[type="button"]');
    let declineButton: Element | null = null;
    buttons.forEach((btn) => {
      if (btn.textContent?.includes('Decline')) {
        declineButton = btn;
      }
    });

    fireEvent.click(declineButton!);

    expect(mockOnChoose).toHaveBeenCalledWith('test-decision-1', 'option-2');
  });

  it('should render a close button', () => {
    const mockOnChoose = vi.fn();

    render(
      <DecisionDialog decision={mockDecision} onChoose={mockOnChoose} />
    );

    const closeButton = screen.getByTitle('Dismiss (no action)');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveTextContent('✕');
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnChoose = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <DecisionDialog
        decision={mockDecision}
        onChoose={mockOnChoose}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByTitle('Dismiss (no action)');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should render deadline if provided', () => {
    const mockOnChoose = vi.fn();
    const decisionWithDeadline: Decision = {
      ...mockDecision,
      deadline: { month: 5, day: 15 },
    };

    render(
      <DecisionDialog decision={decisionWithDeadline} onChoose={mockOnChoose} />
    );

    expect(screen.getByText(/Deadline: Month 5, Day 15/)).toBeInTheDocument();
  });

  it('should handle multiple clicks correctly', () => {
    const mockOnChoose = vi.fn();

    const { rerender, container } = render(
      <DecisionDialog decision={mockDecision} onChoose={mockOnChoose} />
    );

    let buttons = container.querySelectorAll('button[type="button"]');
    let acceptButton: Element | null = null;
    buttons.forEach((btn) => {
      if (btn.textContent?.includes('Accept') && !btn.textContent?.includes('Decline')) {
        acceptButton = btn;
      }
    });
    fireEvent.click(acceptButton!);

    expect(mockOnChoose).toHaveBeenCalledWith('test-decision-1', 'option-1');

    // Re-render with a different decision to simulate a new decision
    const secondDecision: Decision = {
      id: 'test-decision-2',
      type: 'strategy_question',
      title: 'Second Decision',
      description: 'Another test decision',
      options: [
        {
          id: 'option-3',
          label: 'Option A',
          description: 'Choose A',
        },
      ],
    };

    mockOnChoose.mockClear();
    rerender(
      <DecisionDialog decision={secondDecision} onChoose={mockOnChoose} />
    );

    buttons = container.querySelectorAll('button[type="button"]');
    let optionAButton: Element | null = null;
    buttons.forEach((btn) => {
      if (btn.textContent?.includes('Option A')) {
        optionAButton = btn;
      }
    });
    fireEvent.click(optionAButton!);

    expect(mockOnChoose).toHaveBeenCalledWith('test-decision-2', 'option-3');
  });

  it('should have proper button styling with pointer-events-auto', () => {
    const mockOnChoose = vi.fn();

    const { container } = render(
      <DecisionDialog decision={mockDecision} onChoose={mockOnChoose} />
    );

    const dialogContent = container.querySelector('.pointer-events-auto');
    expect(dialogContent).toBeInTheDocument();
  });
});
