import styled from 'styled-components';
import Button from '@splunk/react-ui/Button';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';

export const ActionButtonComponent = styled(Button)`
    margin: 0px 5px;
`;

export const WaitSpinnerWrapper = styled(WaitSpinner)`
    position: fixed;
    top: 50%;
    left: 50%;
`;

export const TableCaptionComponent = styled.div`
    text-align: left;
`;

export const TableSelectBoxWrapper = styled.span`
    button {
        margin-left: 50%;
        min-width: 100px;
    }
`;
