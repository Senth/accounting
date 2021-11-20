import React, { createContext } from 'react';

export const PageFunctionContext = createContext();

class PageFunctionContextProvider extends React.Component {
  state = {
    history: null,
  }

  render() {
    return (
      <PageFunctionContext.Provider value={this.state}>
        {this.props.children}
      </PageFunctionContext.Provider>
    );
  }
}

export default PageFunctionContextProvider;