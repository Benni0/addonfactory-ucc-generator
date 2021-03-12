import React from 'react';
import ColumnLayout from '@splunk/react-ui/ColumnLayout';
import update from 'immutability-helper';
import axios from 'axios';

import Select from '@splunk/react-ui/Select';
import PropTypes from 'prop-types';
import TableFilter from './TableFilter';
import CustomTable from './CustomTable';
import {
    TableCaptionComponent,
    TableSelectBoxWrapper,
    WaitSpinnerWrapper,
} from './CustomTableStyle';
import { getUnifiedConfigs, generateToast } from '../../util/util';
import InputRowContext from '../../context/InputRowContext';
import { axiosCallWrapper } from '../../util/axiosCallWrapper';

class TableWrapper extends React.PureComponent {
    static contextType = InputRowContext;

    constructor() {
        super();
        this.state = {
            loading: true,
            searchText: '',
            searchType: 'all',
            selectedPage: '10',
            error: false,
        };
        this.unifiedConfigs = getUnifiedConfigs();
    }

    componentDidMount() {
        this.fetchInputs();
    }

    fetchInputs() {
        this.setState({
            loading: true,
        });
        const requests = [];
        this.unifiedConfigs.pages.inputs.services.forEach((service) => {
            requests.push(axiosCallWrapper(service.name));
        });
        axios
            .all(requests)
            .catch((error) => {
                let message = '';
                if (error.response) {
                    // The request was made and the server responded with a status code
                    message = `Error received from server: ${error.response.data.messages[0].text}`;
                    error.ucc_err_code = 'ERR0001';
                    generateToast(message);
                } else if (error.request) {
                    // The request was made but no response was received
                    message = `No response received while making request to input services`;
                    error.ucc_err_code = 'ERR0002';
                    generateToast(message);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    message = `Error making request to input services`;
                    error.ucc_err_code = 'ERR0003';
                    generateToast(message);
                }
                this.setState({
                    error,
                });
                this.setState({
                    loading: false,
                });
                return Promise.reject(error);
            })
            .then((response) => {
                // const isNotUndefined = response.every(Boolean);
                this.modifyAPIResponse(response.map((res) => res.data.entry));
            });
    }

    modifyAPIResponse(data) {
        const obj = {};
        this.unifiedConfigs.pages.inputs.services.forEach((service, index) => {
            if (service && service.name && data) {
                const tmpObj = {};
                data[index].forEach((val) => {
                    tmpObj[val.name] = {
                        ...val.content,
                        id: val.id,
                        name: val.name,
                        serviceName: service.name,
                    };
                });
                obj[service.name] = tmpObj;
            }
        });
        this.context.setRowData({ rowData: obj });
        this.setState({
            loading: false,
        });
    }

    render() {
        const { rowData, setRowData } = this.context;
        const { isInput, serviceName } = this.props;

        /**
         *
         * @param row {Object} row
         */
        const changeStatus = (row) => {
            setRowData((state) => {
                return {
                    rowData: update(state.rowData, {
                        [row.serviceName]: {
                            [row.name]: { __toggleDisable: { $set: true } },
                        },
                    }),
                };
            });
            const params = new URLSearchParams();
            params.append('disabled', !row.disabled);
            axiosCallWrapper(
                `${row.serviceName}/${row.name}`,
                null,
                params,
                { 'Content-Type': 'application/x-www-form-urlencoded' },
                'post'
            )
                .catch((error) => {
                    let message = '';
                    if (error.response) {
                        // The request was made and the server responded with a status code
                        message = `Error received from server: ${error.response.data.messages[0].text}`;
                        generateToast(message);
                    } else if (error.request) {
                        // The request was made but no response was received
                        message = `No response received while making request to ${row.serviceName}/${row.name}`;
                        generateToast(message);
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        message = `Error making request to ${row.serviceName}/${row.name}`;
                        generateToast(message);
                    }
                    setRowData((state) => {
                        return {
                            rowData: update(state.rowData, {
                                [row.serviceName]: {
                                    [row.name]: { __toggleDisable: { $set: false } },
                                },
                            }),
                        };
                    });
                    return Promise.reject(error);
                })
                .then((response) => {
                    setRowData((state) => {
                        return {
                            rowData: update(state.rowData, {
                                [row.serviceName]: {
                                    [row.name]: {
                                        disabled: { $set: response.data.entry[0].content.disabled },
                                        __toggleDisable: { $set: false },
                                    },
                                },
                            }),
                        };
                    });
                });
        };

        const handleFilterChange = (e, { value }) => {
            this.setState({
                searchText: value,
            });
        };

        const handleChange = (e, { value }) => {
            this.setState({
                searchType: value,
            });
        };

        const getSearchTypeDropdown = () => {
            const { services } = this.unifiedConfigs.pages.inputs;

            let arr = [];
            arr = services.map((service) => {
                return (
                    <Select.Option key={service.name} label={service.title} value={service.name} />
                );
            });

            arr.unshift(<Select.Option key="all" label="All" value="all" />);
            return arr;
        };

        /**
         *
         * @param {Array} data
         * This function will iterate an arrray and match each key-value with the searchText
         * It will return a new array which will match with searchText
         */
        const findByMatchingValue = (data) => {
            const arr = [];
            Object.keys(data).forEach((v) => {
                let found = false;
                Object.keys(data[v]).forEach((vv) => {
                    if (
                        typeof data[v][vv] === 'string' &&
                        data[v][vv].toLowerCase().includes(this.state.searchText.toLowerCase())
                    ) {
                        if (!found) {
                            arr.push(data[v]);
                            found = true;
                        }
                    }
                });
            });
            return arr;
        };

        const getRowData = () => {
            if (this.state.searchType === 'all') {
                let arr = [];
                Object.keys(rowData).forEach((key) => {
                    let newArr = [];
                    if (this.state.searchText && this.state.searchText.length) {
                        newArr = findByMatchingValue(rowData[key]);
                    } else {
                        newArr = Object.keys(rowData[key]).map((val) => rowData[key][val]);
                    }
                    arr = arr.concat(newArr);
                });
                return arr;
            }
            return findByMatchingValue(rowData[this.state.searchType] || []);
        };

        const filteredData = !this.state.loading && getRowData();

        if (this.state.error.ucc_err_code) {
            throw this.state.error;
        }

        return (
            <>
                {this.state.loading ? (
                    <WaitSpinnerWrapper size="large" />
                ) : (
                    <>
                        <ColumnLayout gutter={8}>
                            <ColumnLayout.Row
                                style={{
                                    borderTop: '1px solid #e1e6eb',
                                    padding: '5px 0px',
                                    marginTop: '25px',
                                }}
                            >
                                <ColumnLayout.Column span={4}>
                                    <TableCaptionComponent>
                                        <div>
                                            {filteredData.length} Input
                                            {filteredData.length > 1 && <span>s</span>}
                                            <TableSelectBoxWrapper>
                                                <Select
                                                    value={this.state.selecetedPage}
                                                    onChange={(e, { value }) => {
                                                        this.setState({
                                                            selectedPage: value,
                                                        });
                                                    }}
                                                >
                                                    <Select.Option
                                                        key="10"
                                                        label="10 Per Page"
                                                        value="10"
                                                    />
                                                    <Select.Option
                                                        key="25"
                                                        label="25 Per Page"
                                                        value="25"
                                                    />
                                                    <Select.Option
                                                        key="50"
                                                        label="50 Per Page"
                                                        value="50"
                                                    />
                                                </Select>
                                                <Select
                                                    value={this.state.searchType}
                                                    onChange={handleChange}
                                                >
                                                    {getSearchTypeDropdown()}
                                                </Select>
                                            </TableSelectBoxWrapper>
                                        </div>
                                    </TableCaptionComponent>
                                </ColumnLayout.Column>
                                <ColumnLayout.Column span={4}>
                                    <TableFilter handleChange={handleFilterChange} />
                                </ColumnLayout.Column>
                                <ColumnLayout.Column span={4} />
                            </ColumnLayout.Row>
                        </ColumnLayout>

                        <CustomTable
                            isInput={isInput}
                            serviceName={serviceName}
                            data={filteredData}
                            handleToggleActionClick={(row) => changeStatus(row)}
                        />
                    </>
                )}
            </>
        );
    }
}

TableWrapper.propTypes = {
    isInput: PropTypes.bool,
    serviceName: PropTypes.string.isRequired,
};

export default TableWrapper;
