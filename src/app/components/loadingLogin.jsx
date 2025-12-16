import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div id="col">
        <div id="img-wrap">
          <span className="loader" />
        </div></div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  #col {
    width: 50%;
    margin: 0 auto;
  }

  .loader {
    content: ' ';
    border: 5px solid white;
    border-radius: 30px;
    height: 30px;
    left: 50%;
    margin: -15px 0 0 -15px;
    opacity: 0;
    position: absolute;
    top: 50%;
    width: 30px;
    animation: pulsate 1s ease-out;
    animation-iteration-count: infinite;
  }

  @keyframes pulsate {
    0% {
      transform: scale(.1);
      opacity: 0.0;
    }

    50% {
      opacity: 1;
    }

    100% {
      transform: scale(1.2);
      opacity: 0;
    }
  }`;

export default Loader;
