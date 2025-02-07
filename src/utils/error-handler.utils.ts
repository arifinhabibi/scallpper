export class ErrorHandler {
    static handleApiError(error: any, message: string) {
      console.error(`${message}: ${error.message}`);
    }
  }