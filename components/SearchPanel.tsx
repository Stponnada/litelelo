import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import Spinner from './Spinner';

interface SearchPanelProps {
    onNavigate: () => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ onNavigate }) => {
    const navigation = useNavigation();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleSearch = async () => {
            if (searchTerm.trim().length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .or(`username.ilike.%${searchTerm.trim()}%,full_name.ilike.%${searchTerm.trim()}%`)
                .limit(10);
            
            if (error) {
                console.error("Error searching profiles:", error);
            } else {
                setResults(data || []);
            }
            setLoading(false);
        };

        const debounceTimer = setTimeout(() => {
            handleSearch();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Search</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    placeholder="Search"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    style={styles.input}
                    autoFocus
                    placeholderTextColor="#666"
                />
            </View>
            <View style={styles.divider} />
            <ScrollView style={styles.content}>
                {loading ? (
                    <View style={styles.spinnerContainer}>
                        <Spinner />
                    </View>
                ) : results.length > 0 ? (
                    <View style={styles.resultsList}>
                        {results.map(profile => (
                            <TouchableOpacity
                                key={profile.user_id}
                                style={styles.suggestionCard}
                                onPress={() => {
                                    onNavigate();
                                    navigation.navigate('Profile', { username: profile.username });
                                }}
                            >
                                <Image
                                    source={{ uri: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}&background=0D8ABC&color=fff&size=50` }}
                                    style={styles.avatar}
                                />
                                <View>
                                    <Text style={styles.username}>{profile.username}</Text>
                                    <Text style={styles.fullName}>{profile.full_name}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : searchTerm.length > 1 && (
                    <Text style={styles.noResults}>No results found.</Text>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        paddingHorizontal: 12
    },
    inputContainer: {
        paddingHorizontal: 12
    },
    input: {
        width: '100%',
        padding: 8,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        fontSize: 16,
        color: '#222'
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 24
    },
    content: {
        flex: 1,
        marginRight: -12,
        paddingRight: 12
    },
    spinnerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    resultsList: {
        gap: 8
    },
    suggestionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#fff'
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22
    },
    username: {
        fontSize: 14,
        fontWeight: '600',
        color: '#222'
    },
    fullName: {
        fontSize: 12,
        color: '#666'
    },
    noResults: {
        textAlign: 'center',
        color: '#666',
        paddingHorizontal: 12
    }
});

export default SearchPanel;