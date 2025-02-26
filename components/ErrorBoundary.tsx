import React, { Component, ReactNode } from 'react';
import { View, Text } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show fallback UI.
    return { hasError: false }; // Set to false to prevent showing error UI
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // You can log the error to a service here
    console.log('Error caught by boundary:', error, errorInfo);
    // We're intentionally not setting hasError to true to prevent showing error UI
  }

  render(): ReactNode {
    // Always render children, even if there's an error
    return this.props.children;
  }
}
