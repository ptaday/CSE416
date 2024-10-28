import React from 'react';
import {RequestFile} from './RequestFile';
import {FileShare} from './FileShare';
import '../CloudDrive.css';




// Define an interface for component state
interface ExploreState {
  toggleShare: boolean;
  toggleRequest: boolean;
}

interface ExploreProps {
    isDarkTheme: boolean;
}

export class Explore extends React.Component<ExploreProps, ExploreState> {
  constructor(props: ExploreProps) {
    super(props);
    this.state = {
      toggleShare: false, // Default is Login active
      toggleRequest: true,
    };

    this.toggleShare = this.toggleShare.bind(this);
    this.toggleRequest = this.toggleRequest.bind(this);
  
  }

  toggleRequest() {
    this.setState({
        toggleRequest: true,
        toggleShare: false,
    });
  }

  toggleShare() {
    this.setState({
        toggleRequest: false,
        toggleShare: true,
    });
  }

 

  render() {
    const { toggleRequest, toggleShare } = this.state;
    const {isDarkTheme} = this.props;

    return (
       
      
        <div className="cloud-drive-container">
             <div className="tab-container">
          <div className={`tab ${toggleRequest ? 'active' : 'inactive'}`} onClick={this.toggleRequest}>
            File Request
          </div>
          <div className={`tab ${toggleShare ? 'active' : 'inactive'}`} onClick={this.toggleShare} >
            File Share
          </div>
        </div>
          
          {toggleShare && <FileShare isDarkTheme={isDarkTheme}/>}
          {toggleRequest && <RequestFile isDarkTheme={isDarkTheme} />} {}
        </div>
    );
  }
}
