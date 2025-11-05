import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SubjectSelector from '../../components/SubjectSelector';

describe('SubjectSelector Component', () => {
  const mockOnSubjectSelect = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    const { getByText } = render(
      <SubjectSelector
        visible={true}
        onClose={mockOnClose}
        onSubjectSelect={mockOnSubjectSelect}
      />
    );

    expect(getByText(/Choose Subject/i)).toBeTruthy();
  });

  it('renders search input', () => {
    const { getByPlaceholderText } = render(
      <SubjectSelector
        visible={true}
        onClose={mockOnClose}
        onSubjectSelect={mockOnSubjectSelect}
      />
    );

    expect(getByPlaceholderText(/Search or type/i)).toBeTruthy();
  });

  it('renders modal structure when visible', () => {
    const { getByText, getByPlaceholderText } = render(
      <SubjectSelector
        visible={true}
        onClose={mockOnClose}
        onSubjectSelect={mockOnSubjectSelect}
      />
    );

    // Check that key UI elements are present
    expect(getByText(/Choose Subject/i)).toBeTruthy();
    expect(getByPlaceholderText(/Search or type/i)).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <SubjectSelector
        visible={false}
        onClose={mockOnClose}
        onSubjectSelect={mockOnSubjectSelect}
      />
    );

    expect(queryByText(/Choose Subject/i)).toBeNull();
  });
});
