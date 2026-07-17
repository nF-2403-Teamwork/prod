import { Component } from "react";

export default class ErrorBoundaryPage extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <div className="card w-full max-w-lg bg-base-100 shadow-xl">
            <div className="card-body items-center text-center gap-4">
              <div className="text-6xl">⚠️</div>
              <h2 className="card-title text-2xl text-error">Xato yuz berdi</h2>
              <p className="text-base-content/60">
                Ilovada kutilmagan xato yuz berdi. Iltimos sahifani yangilang.
              </p>
              {this.state.error && (
                <div className="alert alert-error text-left w-full">
                  <code className="text-xs break-all">{this.state.error.message}</code>
                </div>
              )}
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                Sahifani yangilash
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
